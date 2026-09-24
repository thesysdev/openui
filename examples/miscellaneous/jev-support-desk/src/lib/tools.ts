import type { ToolSpec } from "@openuidev/lang-core";
import {
  customerName,
  itemsOf,
  RETURN_WINDOW_DAYS,
  TODAY,
  writes,
  type Item,
  type Order,
} from "./store";

// Tools read the customer and the item from the request context, never from
// the screen, so one saved screen works for every customer.
export interface RequestContext {
  customerId: string;
  itemId: string | null;
}

const g = globalThis as { deskRequests?: Map<string, RequestContext> };
export const requests = (g.deskRequests ??= new Map());

const money = (n: number) => `$${n.toFixed(2)}`;
const day = (iso = "") =>
  iso &&
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const addDays = (iso: string, n: number) =>
  new Date(Date.parse(`${iso}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

function status(o: Order) {
  if (writes.cancelled.has(o.id)) return "Cancelled";
  return { processing: "Processing", shipped: "On the way", delivered: "Delivered" }[o.status];
}

function itemView(item: Item, o: Order) {
  const deadline = o.deliveredOn ? addDays(o.deliveredOn, RETURN_WINDOW_DAYS) : "";
  return {
    id: item.id,
    name: item.name,
    variant: item.variant,
    price: money(item.price),
    orderId: o.id,
    orderStatus: status(o),
    returnEligible: o.status === "delivered" && deadline >= TODAY && !writes.returned.has(item.id),
    returnDeadline: day(deadline),
    sizes: (item.sizes ?? []).map((s) => ({ value: s, label: s })),
  };
}

function findItem(ctx: RequestContext, itemId?: unknown) {
  const id = typeof itemId === "string" && itemId ? itemId : ctx.itemId;
  const found = itemsOf(ctx.customerId).find((x) => x.item.id === id);
  if (!found) throw new Error("Pick an item first");
  return found;
}

function findOrder(ctx: RequestContext, orderId?: unknown) {
  const mine = itemsOf(ctx.customerId).map((x) => x.order);
  return mine.find((o) => o.id === orderId) ?? findItem(ctx).order;
}

const str = { type: "string" };
const obj = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
});
const list = (items: object) => ({ type: "array", items });
const option = obj({ value: str, label: str });
const item = obj({
  id: str,
  name: str,
  variant: str,
  price: str,
  orderId: str,
  orderStatus: str,
  returnEligible: { type: "boolean" },
  returnDeadline: str,
  sizes: list(option),
});

interface Tool extends ToolSpec {
  run(ctx: RequestContext, args: Record<string, unknown>): unknown;
}

export const TOOLS: Tool[] = [
  {
    name: "get_request_context",
    description:
      "The signed-in customer and the item this request is about (item may be null). Start every screen here.",
    inputSchema: obj({}),
    outputSchema: obj({ customer: obj({ name: str, firstName: str }), item }),
    run(ctx) {
      const name = customerName(ctx.customerId);
      const found = ctx.itemId ? findItem(ctx) : null;
      return {
        customer: { name, firstName: name.split(" ")[0] },
        item: found && itemView(found.item, found.order),
      };
    },
  },
  {
    name: "list_items",
    description: "Everything the customer bought, as Select options (value = item id).",
    inputSchema: obj({}),
    outputSchema: obj({ rows: list(option) }),
    run: (ctx) => ({
      rows: itemsOf(ctx.customerId).map(({ item, order }) => ({
        value: item.id,
        label: `${item.name} (${item.variant}), order ${order.id}`,
      })),
    }),
  },
  {
    name: "get_shipment",
    description: "Tracking for an order. orderId defaults to the order of the request's item.",
    inputSchema: obj({ orderId: str }),
    outputSchema: obj({
      orderId: str,
      carrier: str,
      status: str,
      eta: str,
      address: str,
      events: list(obj({ date: str, description: str })),
    }),
    run(ctx, args) {
      const o = findOrder(ctx, args.orderId);
      const events = [
        { date: day(o.placedOn), description: "Order placed" },
        ...(o.status === "processing"
          ? []
          : [{ date: day(addDays(o.placedOn, 1)), description: `Shipped with ${o.carrier}` }]),
        ...(o.status === "delivered"
          ? [{ date: day(o.deliveredOn), description: "Delivered" }]
          : []),
      ].reverse();
      return {
        orderId: o.id,
        carrier: o.carrier,
        status: status(o),
        eta: day(o.eta ?? o.deliveredOn),
        address: writes.addresses.get(o.id) ?? o.address,
        events,
      };
    },
  },
  {
    name: "get_return_options",
    description: "Reasons and refund methods for a return, as Select options.",
    inputSchema: obj({}),
    outputSchema: obj({ reasons: list(option), refundMethods: list(option) }),
    run: () => ({
      reasons: [
        { value: "wrong_size", label: "Wrong size or fit" },
        { value: "damaged", label: "Arrived damaged" },
        { value: "not_as_described", label: "Not as described" },
        { value: "changed_mind", label: "Changed my mind" },
      ],
      refundMethods: [
        { value: "original", label: "Original payment method" },
        { value: "store_credit", label: "Store credit (+10%)" },
      ],
    }),
  },
  {
    name: "create_return",
    description: "Start a return for an item.",
    inputSchema: obj({ itemId: str, reason: str, refundMethod: str }, [
      "itemId",
      "reason",
      "refundMethod",
    ]),
    outputSchema: obj({ returnId: str, refund: str, instructions: str }),
    run(ctx, args) {
      const { item, order } = findItem(ctx, args.itemId);
      if (!itemView(item, order).returnEligible)
        throw new Error(`${item.name} can no longer be returned`);
      if (!args.reason) throw new Error("Pick a reason");
      writes.returned.add(item.id);
      return {
        returnId: `RT-${4100 + writes.returned.size}`,
        refund: money(item.price * (args.refundMethod === "store_credit" ? 1.1 : 1)),
        instructions: `Drop the package at any ${order.carrier} location within 14 days. The label is in your email.`,
      };
    },
  },
  {
    name: "create_exchange",
    description: "Exchange an item for another size. newSize must be one of the item's sizes.",
    inputSchema: obj({ itemId: str, newSize: str }, ["itemId", "newSize"]),
    outputSchema: obj({ exchangeId: str, instructions: str }),
    run(ctx, args) {
      const { item, order } = findItem(ctx, args.itemId);
      if (!item.sizes?.includes(String(args.newSize)))
        throw new Error("Pick one of the available sizes");
      writes.returned.add(item.id);
      return {
        exchangeId: `EX-${7300 + writes.returned.size}`,
        instructions: `${item.name} in ${args.newSize} ships when ${order.carrier} scans your return.`,
      };
    },
  },
  {
    name: "update_address",
    description: "Change the delivery address of an order that has not been delivered.",
    inputSchema: obj({ orderId: str, address: str }, ["orderId", "address"]),
    outputSchema: obj({ orderId: str, address: str }),
    run(ctx, args) {
      const o = findOrder(ctx, args.orderId);
      if (o.status === "delivered") throw new Error("This order was already delivered");
      if (!args.address) throw new Error("Enter the new address");
      writes.addresses.set(o.id, String(args.address));
      return { orderId: o.id, address: String(args.address) };
    },
  },
  {
    name: "cancel_order",
    description: "Cancel an order that is still processing.",
    inputSchema: obj({ orderId: str }, ["orderId"]),
    outputSchema: obj({ orderId: str, status: str }),
    run(ctx, args) {
      const o = findOrder(ctx, args.orderId);
      if (o.status !== "processing") throw new Error("Only processing orders can be cancelled");
      writes.cancelled.add(o.id);
      return { orderId: o.id, status: "Cancelled" };
    },
  },
];
