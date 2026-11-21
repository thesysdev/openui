"use client";

import { useThread } from "@openuidev/react-headless";
import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { Button } from "@openuidev/react-ui";
import { ShoppingBag } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { z } from "zod/v4";
import type { CartSummary } from "../lib/tools/update-cart";

// The cart lives in the thread header: a button with the item count that opens the cart as a
// popover, at any point in the conversation. Answers mark each cart change with CartLink, and the
// button finds the thread's cart id in those marks, so a thread opened again finds its cart too.
// The cart itself always comes from the store, through /api/cart.

const OpenCart = createContext<{ isOpen: boolean; setOpen: (open: boolean) => void }>({
  isOpen: false,
  setOpen: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  return <OpenCart.Provider value={{ isOpen, setOpen }}>{children}</OpenCart.Provider>;
}

// The latest cart id in the thread's answers, and how many cart changes they mark, so the
// button reloads the cart after each one.
const cartLink = /CartLink\(\s*"(gid:\/\/shopify\/Cart\/[^"]+)"/g;
function useThreadCart() {
  const messages = useThread((state) => state.messages);
  let cartId: string | null = null;
  let changes = 0;
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    if (typeof message.content !== "string") continue;
    for (const match of message.content.matchAll(cartLink)) {
      cartId = match[1];
      changes += 1;
    }
  }
  return { cartId, changes };
}

async function cartRequest(init?: RequestInit, cartId?: string) {
  const response = await fetch(
    cartId ? `/api/cart?id=${encodeURIComponent(cartId)}` : "/api/cart",
    init,
  );
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Couldn't load the cart.");
  return body as CartSummary;
}

// The header button and its popover.
export function CartButton() {
  const { cartId, changes } = useThreadCart();
  const { isOpen, setOpen } = useContext(OpenCart);
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Forget the previous thread's cart when the cart id changes.
  useEffect(() => setCart(null), [cartId]);

  // Load the cart when the thread's cart changes, and each time the popover opens.
  useEffect(() => {
    if (!cartId) return;
    const controller = new AbortController();
    cartRequest({ signal: controller.signal }, cartId)
      .then((summary) => {
        setCart(summary);
        setError(null);
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, [cartId, changes, isOpen]);

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, setOpen]);

  const setQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      if (!cartId) return;
      setSaving(true);
      try {
        setCart(
          await cartRequest({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: cartId, variant_id: variantId, quantity }),
          }),
        );
        setError(null);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Couldn't update the cart.");
      } finally {
        setSaving(false);
      }
    },
    [cartId],
  );

  if (!cartId) return null;
  const count = cart?.item_count ?? 0;
  return (
    <div className="cart" ref={root}>
      <button
        type="button"
        className="cart__button"
        aria-expanded={isOpen}
        aria-label={`Cart, ${count} items`}
        onClick={() => setOpen(!isOpen)}
      >
        <ShoppingBag size={16} />
        <span>Cart</span>
        {count > 0 && <span className="cart__count">{count}</span>}
      </button>
      {isOpen && (
        <div className="cart__popover" role="dialog" aria-label="Your cart">
          <div className="cart__heading">Your cart</div>
          {error && <p className="cart__error">{error}</p>}
          {!cart && !error && <p className="cart__note">Loading your cart…</p>}
          {cart && !cart.items.length && <p className="cart__note">Your cart is empty.</p>}
          {/* The store reorders lines after a change, so sort them to keep rows in place. */}
          {[...(cart?.items ?? [])]
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((item) => (
              <div className="cart__item" key={item.variant_id}>
                {item.image ? <img src={item.image} alt="" /> : <div className="cart__photo" />}
                <div className="cart__details">
                  <div className="cart__title">{item.title}</div>
                  <div className="cart__note">{item.price} each</div>
                  <div className="cart__quantity">
                    <button
                      type="button"
                      aria-label={`One less ${item.title}`}
                      disabled={saving}
                      onClick={() => void setQuantity(item.variant_id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`One more ${item.title}`}
                      disabled={saving || item.quantity >= 20}
                      onClick={() => void setQuantity(item.variant_id, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="cart__remove"
                      disabled={saving}
                      onClick={() => void setQuantity(item.variant_id, 0)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="cart__total">{item.total}</div>
              </div>
            ))}
          {cart && cart.items.length > 0 && (
            <div className="cart__footer">
              <div className="cart__sum">
                <span>Total · {cart.item_count} items</span>
                <span>{cart.totals.total ?? cart.totals.subtotal}</span>
              </div>
              {cart.checkout_url ? (
                <Button
                  variant="primary"
                  onClick={() => window.open(cart.checkout_url!, "_blank", "noopener")}
                >
                  Continue to checkout
                </Button>
              ) : (
                <p className="cart__note">This store has no online checkout.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Marks a cart change in an answer: a View cart link that opens the header's cart, which also
// opens by itself once after a change streams in.
export const CartLink = defineComponent({
  name: "CartLink",
  description:
    "Marks a cart change in the answer and links to the cart in the header, where the shopper changes quantities and checks out. cartId is the cart_id from the latest update_cart result.",
  props: z.object({ cartId: z.string() }),
  component: () => {
    const isStreaming = useIsStreaming();
    const { setOpen } = useContext(OpenCart);
    const streamed = useRef(false);
    useEffect(() => {
      if (isStreaming) streamed.current = true;
      else if (streamed.current) setOpen(true);
    }, [isStreaming, setOpen]);
    if (isStreaming) return null;
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        View cart
      </Button>
    );
  },
});
