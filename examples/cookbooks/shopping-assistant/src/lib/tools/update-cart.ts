import { z } from "zod/v4";
import { changeCart, formatPrice, selectVariants, type Cart } from "../shopify";

// The update_cart function tool: its JSON schema for Gateway, argument validation, the cart
// change, and the executor that runTools() calls.

export const updateCartTool = {
  type: "function" as const,
  function: {
    name: "update_cart",
    description:
      "Add items to the shopper's cart, change their quantities, apply discount codes, or read the cart. Returns every item with its price, the totals, the discounts, and a checkout link when the store has one.",
    parameters: {
      type: "object",
      properties: {
        cart_id: {
          type: ["string", "null"],
          description:
            "The cart_id from the last update_cart result in this conversation. Null when there is none yet.",
        },
        add: {
          type: "array",
          description:
            "Products to add: the product id, the chosen value of each option, and how many.",
          items: {
            type: "object",
            properties: {
              product_id: {
                type: "string",
                description: "A product id exactly as search_products returned it.",
              },
              options: {
                type: "array",
                description:
                  "One entry per option, such as Size and Color. Empty for a product without options.",
                items: {
                  type: "object",
                  properties: { name: { type: "string" }, value: { type: "string" } },
                  required: ["name", "value"],
                  additionalProperties: false,
                },
              },
              quantity: { type: "integer", minimum: 1, maximum: 20 },
            },
            required: ["product_id", "options", "quantity"],
            additionalProperties: false,
          },
        },
        set: {
          type: "array",
          description: "Cart items whose quantity to replace. Quantity 0 removes the item.",
          items: {
            type: "object",
            properties: {
              variant_id: { type: "string", description: "An item's variant_id from the cart." },
              quantity: { type: "integer", minimum: 0, maximum: 20 },
            },
            required: ["variant_id", "quantity"],
            additionalProperties: false,
          },
        },
        discount_codes: {
          type: ["array", "null"],
          items: { type: "string" },
          description:
            "Discount codes the shopper gave, replacing those on the cart; an empty array removes them. Null leaves the codes as they are.",
        },
      },
      required: ["cart_id", "add", "set", "discount_codes"],
      additionalProperties: false,
    },
    strict: true,
  },
};

// Validate arguments again on the server; the model's output is untrusted input.
const argsSchema = z
  .object({
    cart_id: z.string().startsWith("gid://shopify/Cart/").max(300).nullable(),
    add: z
      .array(
        z
          .object({
            product_id: z.string().startsWith("gid://shopify/Product/").max(200),
            options: z
              .array(z.object({ name: z.string().max(60), value: z.string().max(60) }).strict())
              .max(3),
            quantity: z.number().int().min(1).max(20),
          })
          .strict(),
      )
      .max(10),
    set: z
      .array(
        z
          .object({
            variant_id: z.string().startsWith("gid://shopify/ProductVariant/").max(200),
            quantity: z.number().int().min(0).max(20),
          })
          .strict(),
      )
      .max(50),
    discount_codes: z.array(z.string().trim().min(1).max(50)).max(5).nullable(),
  })
  .strict();

// Find the in-stock variant with the chosen values. The store does the matching, so the model
// never handles variant ids, and a product with more variants than a search lists still works.
async function findVariant(item: z.infer<typeof argsSchema>["add"][number], signal?: AbortSignal) {
  const selected = item.options.map((option) => ({ name: option.name, label: option.value }));
  const product = await selectVariants(item.product_id, selected, signal);
  const inStock = product.variants.filter((variant) => variant.availability?.available);
  if (!inStock.length) throw new Error(`That choice of ${product.title} is out of stock.`);
  if (inStock.length > 1)
    throw new Error(`Choose a value for each option of ${product.title} before adding it.`);
  return inStock[0].id;
}

function toResult(cart: Cart | null) {
  if (!cart)
    return {
      cart_id: null,
      items: [],
      item_count: 0,
      totals: {},
      discounts: null,
      checkout_url: null,
    };
  const price = (amount: number) => formatPrice(amount, cart.currency);
  const total = (totals: Cart["totals"], type: string) =>
    totals.find((entry) => entry.type === type)?.amount ?? 0;
  return {
    cart_id: cart.id,
    items: cart.line_items.map((line) => ({
      variant_id: line.item.id,
      // Shopify calls the only variant of a product without options "Default Title".
      title: line.item.title.replace(/ [—-] Default Title$/, ""),
      quantity: line.quantity,
      price: price(line.item.price),
      total: price(total(line.totals, "total")),
    })),
    item_count: cart.line_items.reduce((count, line) => count + line.quantity, 0),
    // subtotal and total, plus tax, discount, or shipping when the store estimates them.
    totals: Object.fromEntries(cart.totals.map((entry) => [entry.type, price(entry.amount)])),
    // The store's own message about a rejected code isn't passed on; the code is enough.
    discounts: {
      applied: (cart.discounts?.applied ?? []).map((discount) => ({
        code: discount.code ?? null,
        title: discount.title,
        amount: price(discount.amount),
      })),
      rejected: (cart.discounts?.codes ?? []).filter(
        (code) =>
          !(cart.discounts?.applied ?? []).some(
            (discount) => discount.code?.toLowerCase() === code.toLowerCase(),
          ),
      ),
    },
    checkout_url: cart.continue_url ?? null,
  };
}

export async function executeUpdateCart(
  argsJson: string,
  { signal }: { signal?: AbortSignal } = {},
) {
  signal?.throwIfAborted();
  const args = argsSchema.parse(JSON.parse(argsJson));
  const added = await Promise.all(
    args.add.map(async (item) => ({
      variantId: await findVariant(item, signal),
      quantity: item.quantity,
    })),
  );
  const cart = await changeCart(
    args.cart_id,
    (lines) => {
      const next = new Map(lines.map((line) => [line.variantId, line.quantity]));
      for (const line of added)
        next.set(line.variantId, (next.get(line.variantId) ?? 0) + line.quantity);
      for (const line of args.set) next.set(line.variant_id, line.quantity);
      return [...next].map(([variantId, quantity]) => ({ variantId, quantity }));
    },
    args.discount_codes,
    signal,
  );
  return JSON.stringify(toResult(cart));
}
