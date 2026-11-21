import { z } from "zod/v4";
import { changeCart, getCart } from "../../../lib/shopify";
import { cartSummary } from "../../../lib/tools/update-cart";

export const runtime = "nodejs";

// The cart panel reads and changes the cart here, straight against the store, so it always shows
// the store's items and totals and a quantity change needs no model turn.

const cartId = z.string().startsWith("gid://shopify/Cart/").max(300);

function failed(error: unknown) {
  const message = error instanceof Error ? error.message : "The store couldn't load the cart.";
  return Response.json({ error: message }, { status: 502 });
}

export async function GET(request: Request) {
  const id = cartId.safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success) return Response.json({ error: "Send a cart id." }, { status: 400 });
  try {
    return Response.json(cartSummary(await getCart(id.data, request.signal)));
  } catch (error) {
    return failed(error);
  }
}

// Set one item's quantity. 0 removes it.
export async function POST(request: Request) {
  const body = z
    .object({
      id: cartId,
      variant_id: z.string().startsWith("gid://shopify/ProductVariant/").max(200),
      quantity: z.number().int().min(0).max(20),
    })
    .safeParse(await request.json());
  if (!body.success)
    return Response.json(
      { error: "Send a cart id, a variant id, and a quantity." },
      { status: 400 },
    );
  const { id, variant_id, quantity } = body.data;
  try {
    const cart = await changeCart(
      id,
      (lines) =>
        lines.map((line) => (line.variantId === variant_id ? { ...line, quantity } : line)),
      request.signal,
    );
    return Response.json(cartSummary(cart));
  } catch (error) {
    return failed(error);
  }
}
