import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { z } from "zod/v4";

// Every Shopify store serves its catalog and cart tools over MCP at /api/ucp/mcp, with no API
// key. The default is OpenUI's demo store.
// See https://shopify.dev/docs/agents/catalog/storefront-catalog.
export const store = process.env.SHOPIFY_STORE || "openui.myshopify.com";
const serverUrl = new URL(`https://${store}/api/ucp/mcp`);

// Each request names the agent's Universal Commerce Protocol (UCP) profile, which lists the
// capabilities it supports. This is Shopify's example profile; publish your own before deploying.
const agentProfile =
  "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";

// Prices are integers in the currency's minor units, such as 4000 for CA$40.00.
const moneySchema = z.object({ amount: z.number(), currency: z.string() });

const variantSchema = z.object({
  id: z.string(),
  price: moneySchema,
  availability: z.object({ available: z.boolean() }).nullish(),
  options: z.array(z.object({ name: z.string(), label: z.string() })).nullish(),
  media: z.array(z.object({ url: z.string() })).nullish(),
});

const productSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().nullish(),
  description: z.object({ plain: z.string().nullish(), html: z.string().nullish() }).nullish(),
  price_range: z.object({ min: moneySchema, max: moneySchema }),
  media: z.array(z.object({ url: z.string() })).nullish(),
  // Every option value. A search result lists at most 10 variants per product, so options
  // can have values that none of its variants show.
  options: z
    .array(
      z.object({
        name: z.string(),
        values: z.array(z.object({ label: z.string(), available: z.boolean().nullish() })),
      }),
    )
    .nullish(),
  variants: z.array(variantSchema),
});
export type Product = z.infer<typeof productSchema>;
export type Selection = { name: string; label: string }[];

const totalSchema = z.object({ type: z.string(), amount: z.number() });
const cartSchema = z.object({
  id: z.string(),
  currency: z.string(),
  line_items: z.array(
    z.object({
      item: z.object({ id: z.string(), title: z.string(), price: z.number() }),
      quantity: z.number(),
      totals: z.array(totalSchema),
    }),
  ),
  totals: z.array(totalSchema),
  // A link that opens the store's checkout with the cart's items. Some stores have none.
  continue_url: z.string().nullish(),
});
export type Cart = z.infer<typeof cartSchema>;

type StoreResult = {
  isError?: boolean;
  structuredContent?: {
    messages?: { type: string; code?: string; content?: string }[];
  };
};

class StoreError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

// Open one MCP session, run the calls, and close it. Only the structured result reaches the
// app; tool descriptions and message text meant for a model never reach this app's model.
async function withStore<T>(
  signal: AbortSignal | undefined,
  run: (call: (name: string, args: Record<string, unknown>) => Promise<unknown>) => Promise<T>,
) {
  const client = new Client({ name: "openui-shopping-assistant", version: "0.1.0" });
  await client.connect(new StreamableHTTPClientTransport(serverUrl), { signal });
  try {
    return await run(async (name, args) => {
      const result = (await client.callTool({ name, arguments: args }, undefined, {
        signal,
        timeout: 30_000,
      })) as StoreResult;
      if (result.isError) {
        const error = result.structuredContent?.messages?.find((m) => m.type === "error");
        throw new StoreError(error?.content ?? `The store's ${name} failed.`, error?.code);
      }
      return result.structuredContent;
    });
  } finally {
    await client.close();
  }
}

// Writes carry an idempotency key, so a retried request can't apply a change twice.
const meta = (write = false) => ({
  "ucp-agent": { profile: agentProfile },
  ...(write ? { "idempotency-key": randomUUID() } : {}),
});

// Prices come in minor units: 4000 CAD is CA$40.00, and 4000 JPY is ¥4,000.
const fractionDigits = (currency: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
    .maximumFractionDigits ?? 2;
export const majorUnits = (amount: number, currency: string) =>
  amount / 10 ** fractionDigits(currency);
export const formatPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency }).format(majorUnits(amount, currency));

export async function searchCatalog(
  search: { query: string; limit: number },
  signal?: AbortSignal,
) {
  return withStore(signal, async (call) => {
    const result = await call("search_catalog", {
      meta: meta(),
      catalog: {
        ...(search.query ? { query: search.query } : {}),
        pagination: { limit: search.limit },
      },
    });
    return z.object({ products: z.array(productSchema) }).parse(result).products;
  });
}

// The product with only the in-stock variants that have the selected option values, and each
// option value marked available when an in-stock variant has it together with the selection.
export async function selectVariants(id: string, selected: Selection, signal?: AbortSignal) {
  return withStore(signal, async (call) => {
    const result = await call("get_product", {
      meta: meta(),
      catalog: { id, ...(selected.length ? { selected } : {}) },
    });
    return z.object({ product: productSchema }).parse(result).product;
  });
}

type Line = { variantId: string; quantity: number };

// Read the cart, let `change` compute the new lines, and write them. update_cart replaces every
// line, so the lines always come from the store's current cart. Without a cart, or once it has
// expired, the first change creates one.
export async function changeCart(
  cartId: string | null,
  change: (lines: Line[]) => Line[],
  signal?: AbortSignal,
) {
  return withStore(signal, async (call) => {
    let current: Cart | null = null;
    if (cartId) {
      try {
        current = cartSchema.parse(await call("get_cart", { meta: meta(), id: cartId }));
      } catch (error) {
        if (!(error instanceof StoreError && error.code === "not_found")) throw error;
      }
    }
    const lines = current?.line_items.map((line) => ({
      variantId: line.item.id,
      quantity: line.quantity,
    }));
    const next = change(lines ?? []).filter((line) => line.quantity > 0);
    const lineItems = next.map((line) => ({
      item: { id: line.variantId },
      quantity: line.quantity,
    }));

    // Nothing to write: return the cart as it is.
    if (current && JSON.stringify(next) === JSON.stringify(lines)) return current;
    if (!current && !next.length) return null;
    const result = current
      ? await call("update_cart", {
          meta: meta(true),
          id: current.id,
          cart: { line_items: lineItems },
        })
      : await call("create_cart", { meta: meta(true), cart: { line_items: lineItems } });
    return cartSchema.parse(result);
  });
}
