import { z } from "zod/v4";
import { diverse, rankByMeaning, type IndexedProduct } from "../catalog";
import { embed } from "../embeddings";
import {
  formatPrice,
  lookupProducts,
  majorUnits,
  plainText,
  selectVariants,
  withStore,
  type Product,
  type Selection,
  type StoreCall,
} from "../shopify";

// The search_products function tool: its JSON schema for Gateway, argument validation, the
// search by meaning, and the executor that runTools() calls.

export const searchProductsTool = {
  type: "function" as const,
  function: {
    name: "search_products",
    description:
      "Search the store's catalog of about 1,000 products by meaning. Returns the best matches with photos, a live price, and every value of each option, such as size and color, plus the products it left out and why.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "What the shopper wants, in their own words, with the details that matter: who it's for, the occasion, materials to have or avoid, such as 'a warm hoodie that isn't wool' or 'a gift for a friend who drinks tea'.",
        },
        max_price: {
          type: ["number", "null"],
          description: "Highest price in the store's currency, such as 100. Null for no limit.",
        },
        option_values: {
          type: "array",
          items: { type: "string" },
          description:
            "Option values an in-stock variant must have, such as ['9'] or ['Medium', 'Green']. Empty for any.",
        },
      },
      required: ["query", "max_price", "option_values"],
      additionalProperties: false,
    },
    strict: true,
  },
};

// Validate arguments again on the server; the model's output is untrusted input.
const argsSchema = z
  .object({
    query: z.string().trim().min(2).max(300),
    max_price: z.number().positive().nullable(),
    option_values: z.array(z.string().trim().min(1).max(40)).max(4),
  })
  .strict();
type Args = z.infer<typeof argsSchema>;

// A product's real options. A product without options has one variant, which Shopify names
// "Default Title".
const realOptions = (product: Product) =>
  (product.options ?? []).filter((option) => option.name !== "Title");

// Check a live product against the request: an in-stock variant with every requested option
// value, within the budget. A value can also be a word of the title, because stores often sell
// each color as its own product, such as "Black Sunnies". Returns the product to show, a reason
// it's left out, or neither when it doesn't fit at all.
async function check(call: StoreCall, product: Product, args: Args) {
  const words = product.title.toLowerCase().split(/\W+/);
  const selected: Selection = [];
  for (const value of args.option_values) {
    if (words.includes(value.toLowerCase())) continue;
    const option = realOptions(product).find((option) =>
      option.values.some((v) => v.label.toLowerCase() === value.toLowerCase()),
    );
    // A product without that option at all, such as a plush asked for in size 9, doesn't fit.
    if (!option) return {};
    const label = option.values.find((v) => v.label.toLowerCase() === value.toLowerCase())!.label;
    selected.push({ name: option.name, label });
  }
  let price = product.price_range.min;
  let options = product.options;
  // With a size or color, ask the store for the in-stock variants that have it. Without one,
  // stock is checked when the shopper adds the product to the cart.
  if (selected.length) {
    const checked = await selectVariants(call, product.id, selected);
    const inStock = checked.variants.filter((variant) => variant.availability?.available);
    if (!inStock.length) return { reason: `no ${args.option_values.join(" / ")} in stock` };
    price = inStock.reduce((a, b) => (b.price.amount < a.price.amount ? b : a)).price;
    options = checked.options ?? options;
  }
  if (args.max_price !== null && majorUnits(price.amount, price.currency) > args.max_price)
    return { reason: `over budget, from ${formatPrice(price.amount, price.currency)}` };
  return { product: { ...product, options } };
}

// Keep what the product cards and the variant form need: the store's live title, price, and
// options, and the photos from the index, one per color. The cart finds the variant from the
// product id and the chosen values, so variant ids aren't needed here.
function toResult(product: Product, indexed: IndexedProduct) {
  const description = plainText(product.description?.plain ?? product.description?.html ?? "");
  const { min } = product.price_range;
  return {
    id: product.id,
    title: product.title,
    description: description.length > 320 ? `${description.slice(0, 319)}…` : description,
    photos: indexed.photos,
    price: formatPrice(min.amount, min.currency),
    // in_stock is null when stock wasn't checked for that value.
    options: realOptions(product).map((option) => ({
      name: option.name,
      values: option.values.map((v) => ({ label: v.label, in_stock: v.available ?? null })),
    })),
  };
}

export async function executeSearchProducts(
  argsJson: string,
  { signal }: { signal?: AbortSignal } = {},
) {
  signal?.throwIfAborted();
  const args = argsSchema.parse(JSON.parse(argsJson));

  // Rank the whole catalog by meaning, drop clearly over-budget products using the indexed price,
  // and pick 12 close but different products to check with the store.
  const [request] = await embed([args.query], signal);
  const ranked = rankByMeaning(request, 60).filter(
    (product) => args.max_price === null || product.price <= args.max_price * 1.1,
  );
  const candidates = diverse(request, ranked, 12);

  // The index can be out of date, so the store has the final word on price, stock, and whether
  // a product is still for sale. Check six candidates at a time and stop once six fit, which
  // keeps the calls to the store down.
  type Checked = { indexed: IndexedProduct; product?: Product; reason?: string };
  const checked = await withStore(signal, async (call) => {
    const results: Checked[] = [];
    for (let start = 0; start < candidates.length; start += 6) {
      const batch = candidates.slice(start, start + 6);
      const live = await lookupProducts(
        call,
        batch.map((product) => product.id),
      );
      results.push(
        ...(await Promise.all(
          batch.map(async (indexed): Promise<Checked> => {
            const product = live.get(indexed.id);
            if (!product) return { indexed, reason: "no longer sold" };
            return { indexed, ...(await check(call, product, args)) };
          }),
        )),
      );
      if (results.filter((result) => result.product).length >= 6) break;
    }
    return results;
  });
  const matches = checked.flatMap((result) =>
    result.product ? [toResult(result.product, result.indexed)] : [],
  );
  return JSON.stringify({
    query: args.query,
    products: matches.slice(0, 6),
    // Close matches that didn't fit, so the answer can say why they're missing.
    left_out: checked.flatMap((result) =>
      result.reason ? [{ title: result.indexed.title, reason: result.reason }] : [],
    ),
  });
}
