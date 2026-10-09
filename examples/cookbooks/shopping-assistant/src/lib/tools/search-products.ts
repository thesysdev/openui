import { z } from "zod/v4";
import {
  formatPrice,
  majorUnits,
  resized,
  searchCatalog,
  selectVariants,
  type Product,
  type Selection,
} from "../shopify";

// The search_products function tool: its JSON schema for Gateway, argument validation, the
// catalog search, and the executor that runTools() calls.

export const searchProductsTool = {
  type: "function" as const,
  function: {
    name: "search_products",
    description:
      "Search the store's catalog. Returns matching products with photos, a price, and every value of each option, such as size and color, marked in stock or not, plus the products it left out and why.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "One or two product words, such as 'sneakers' or 'hoodie'. The store matches words literally, so 'running shoes' can find nothing where 'shoes' finds two. Empty to browse the whole catalog.",
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
    query: z.string().trim().max(100),
    max_price: z.number().positive().nullable(),
    option_values: z.array(z.string().trim().min(1).max(40)).max(4),
  })
  .strict();
type Args = z.infer<typeof argsSchema>;

// A product's real options. A product without options has one variant, which Shopify names
// "Default Title".
const realOptions = (product: Product) =>
  (product.options ?? []).filter((option) => option.name !== "Title");

// Check a product against the request: the in-stock variants with every requested option value,
// within the budget. A value can also be a word of the title, because stores often sell each
// color as its own product, such as "Black Sunnies". Returns the product to show, with stock
// for the requested values, or the reason it doesn't fit.
async function check(product: Product, args: Args, signal?: AbortSignal) {
  const words = product.title.toLowerCase().split(/\W+/);
  const selected: Selection = [];
  for (const value of args.option_values) {
    if (words.includes(value.toLowerCase())) continue;
    const option = realOptions(product).find((option) =>
      option.values.some((v) => v.label.toLowerCase() === value.toLowerCase()),
    );
    if (!option) return { reason: `no ${value}` };
    const label = option.values.find((v) => v.label.toLowerCase() === value.toLowerCase())!.label;
    selected.push({ name: option.name, label });
  }
  // A search result lists at most 10 variants, so ask the store for the ones with these values.
  const checked = selected.length ? await selectVariants(product.id, selected, signal) : product;
  const inStock = checked.variants.filter((variant) => variant.availability?.available);
  if (!inStock.length)
    return {
      reason: selected.length ? `no ${args.option_values.join(" / ")} in stock` : "sold out",
    };
  const cheapest = inStock.reduce((a, b) => (b.price.amount < a.price.amount ? b : a)).price;
  if (args.max_price !== null && majorUnits(cheapest.amount, cheapest.currency) > args.max_price)
    return { reason: `over budget, from ${formatPrice(cheapest.amount, cheapest.currency)}` };
  return { product: { ...product, options: checked.options ?? product.options } };
}

const plainText = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// One photo per color: a store attaches each color's photo to its variants, and a search result
// lists only the featured photo at the product level. Each photo is labelled with the variant's
// options other than size, such as "Black", so the answer can show the chosen color.
function photos(product: Product) {
  const byUrl = new Map<string, string>();
  for (const variant of product.variants)
    for (const media of variant.media ?? []) {
      const key = media.url.split("?")[0];
      if (byUrl.has(key)) continue;
      const label = (variant.options ?? [])
        .filter((option) => !/size|title/i.test(option.name))
        .map((option) => option.label)
        .join(" / ");
      byUrl.set(key, label || product.title);
    }
  for (const media of product.media ?? [])
    if (!byUrl.has(media.url.split("?")[0])) byUrl.set(media.url.split("?")[0], product.title);
  return [...byUrl].slice(0, 4).map(([url, label]) => ({ url: resized(url), label }));
}

// Keep what the product cards and the variant form need. The cart finds the variant from the
// product id and the chosen values, so variant ids aren't needed here.
function toResult(product: Product) {
  const description = plainText(product.description?.plain ?? product.description?.html ?? "");
  const { min } = product.price_range;
  return {
    id: product.id,
    title: product.title,
    description: description.length > 160 ? `${description.slice(0, 159)}…` : description,
    photos: photos(product),
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
  // Filter the best 25 matches here rather than with the catalog's price filter, which takes
  // minor units of a currency the model doesn't know until it has seen a result.
  const found = await searchCatalog({ query: args.query, limit: 25 }, signal);
  const checked = await Promise.all(found.map((product) => check(product, args, signal)));
  const matches = checked.flatMap((result) => (result.product ? [result.product] : []));
  return JSON.stringify({
    query: args.query,
    currency: found[0]?.price_range.min.currency ?? null,
    matches: matches.length,
    products: matches.slice(0, 6).map(toResult),
    // The rest of what the search found, so the answer can say why they're missing.
    left_out: found.flatMap((product, index) => {
      const { reason } = checked[index];
      return reason ? [{ title: product.title, reason }] : [];
    }),
  });
}
