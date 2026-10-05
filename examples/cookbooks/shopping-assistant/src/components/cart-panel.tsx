"use client";

import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { Button, DetailedViewPanel, useDetailedView } from "@openuidev/react-ui";
import { useEffect, useId, useRef, useState } from "react";
import { z } from "zod/v4";
import type { CartSummary } from "../lib/tools/update-cart";

// The shopper's cart in Agent Interface's side panel. The model passes only the cart id; the panel
// loads the cart from /api/cart, so its items and totals are the store's, and quantity changes
// go straight to the store without a model turn.
export const CartPanel = defineComponent({
  name: "CartPanel",
  description:
    "Shows the shopper's cart in the side panel, where they can change quantities, remove items, and check out. cartId is the cart_id from the latest update_cart result.",
  props: z.object({ cartId: z.string() }),
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const viewId = useId();
    const { open, isActive } = useDetailedView(viewId);
    const [cart, setCart] = useState<CartSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);

    // Open the panel after a cart change streams in, but not for answers in a thread opened again.
    const streamed = useRef(false);
    useEffect(() => {
      if (isStreaming) streamed.current = true;
      else if (streamed.current) open();
    }, [isStreaming, open]);

    // Load the cart each time the panel opens, so an older answer's panel shows the cart as it
    // is now.
    useEffect(() => {
      if (!isActive || !props.cartId) return;
      const controller = new AbortController();
      fetch(`/api/cart?id=${encodeURIComponent(props.cartId)}`, { signal: controller.signal })
        .then(async (response) => {
          const body = await response.json();
          if (!response.ok) throw new Error(body.error);
          setCart(body);
          setError(null);
        })
        .catch((reason: Error) => {
          if (reason.name !== "AbortError") setError(reason.message);
        });
      return () => controller.abort();
    }, [isActive, props.cartId]);

    async function setQuantity(variantId: string, quantity: number) {
      setSaving(variantId);
      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: props.cartId, variant_id: variantId, quantity }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setCart(body);
        setError(null);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Couldn't update the cart.");
      } finally {
        setSaving(null);
      }
    }

    if (isStreaming) return null;
    return (
      <>
        <Button variant="secondary" onClick={open}>
          View cart
        </Button>
        <DetailedViewPanel viewId={viewId} title="Your cart">
          <div className="cart-panel">
            {error && <p className="cart-panel__error">{error}</p>}
            {!cart && !error && <p className="cart-panel__note">Loading your cart…</p>}
            {cart && !cart.items.length && <p className="cart-panel__note">Your cart is empty.</p>}
            {/* The store reorders lines after a change, so sort them to keep rows in place. */}
            {[...(cart?.items ?? [])]
              .sort((a, b) => a.title.localeCompare(b.title))
              .map((item) => (
                <div className="cart-panel__item" key={item.variant_id}>
                  {item.image ? (
                    <img src={item.image} alt="" />
                  ) : (
                    <div className="cart-panel__photo" />
                  )}
                  <div className="cart-panel__details">
                    <div className="cart-panel__title">{item.title}</div>
                    <div className="cart-panel__note">{item.price} each</div>
                    <div className="cart-panel__quantity">
                      <button
                        type="button"
                        aria-label={`One less ${item.title}`}
                        disabled={saving !== null}
                        onClick={() => void setQuantity(item.variant_id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`One more ${item.title}`}
                        disabled={saving !== null || item.quantity >= 20}
                        onClick={() => void setQuantity(item.variant_id, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="cart-panel__remove"
                        disabled={saving !== null}
                        onClick={() => void setQuantity(item.variant_id, 0)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="cart-panel__total">{item.total}</div>
                </div>
              ))}
            {cart && cart.items.length > 0 && (
              <div className="cart-panel__footer">
                <div className="cart-panel__sum">
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
                  <p className="cart-panel__note">This store has no online checkout.</p>
                )}
              </div>
            )}
          </div>
        </DetailedViewPanel>
      </>
    );
  },
});
