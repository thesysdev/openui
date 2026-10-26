import { sum } from "../../../core/sample-data";
import type { Range } from "../../../core/schemas";
import { current, previous, STOREFRONT } from "./store";

// Purchase and checkout journeys: the storefront and app funnels by device.

export const DEVICES = {
  desktop: {
    label: "Desktop",
    sessions: 0.37,
    orders: 0.48,
    view: 0.58,
    cart: 0.25,
    checkout: 0.52,
    ship: 0.86,
    pay: 0.86,
    prevPay: 0.86,
    aov: 1.12,
  },
  mobile: {
    label: "Mobile",
    sessions: 0.58,
    orders: 0.47,
    view: 0.56,
    cart: 0.21,
    checkout: 0.45,
    ship: 0.81,
    pay: 0.74,
    prevPay: 0.78,
    aov: 0.9,
  },
  tablet: {
    label: "Tablet",
    sessions: 0.05,
    orders: 0.05,
    view: 0.6,
    cart: 0.23,
    checkout: 0.5,
    ship: 0.84,
    pay: 0.8,
    prevPay: 0.8,
    aov: 1.02,
  },
};
type Device = keyof typeof DEVICES;

export function journey(range: Range, device: string, period: "current" | "previous") {
  const get = period === "current" ? current : previous;
  const sessions = sum(get(STOREFRONT, "sessions", range));
  const orders = sum(get(STOREFRONT, "orders", range));
  const devices = (device === "all" ? Object.keys(DEVICES) : [device]) as Device[];
  const t = {
    sessions: 0,
    views: 0,
    carts: 0,
    checkouts: 0,
    shipping: 0,
    payment: 0,
    purchases: 0,
  };
  for (const d of devices) {
    const r = DEVICES[d];
    const cartRate = period === "current" ? r.cart : r.cart * 0.97;
    const s = sessions * r.sessions;
    const views = s * r.view;
    const carts = views * cartRate;
    const checkouts = carts * r.checkout;
    const shipping = checkouts * r.ship;
    t.sessions += s;
    t.views += views;
    t.carts += carts;
    t.checkouts += checkouts;
    t.shipping += shipping;
    t.payment += shipping * (period === "current" ? r.pay : r.prevPay);
    t.purchases += orders * r.orders;
  }
  return t;
}
