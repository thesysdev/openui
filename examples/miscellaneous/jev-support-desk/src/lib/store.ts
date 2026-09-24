import { CUSTOMERS } from "./customers";

export interface Item {
  id: string;
  name: string;
  variant: string;
  price: number;
  sizes?: string[];
}

export interface Order {
  id: string;
  customerId: string;
  placedOn: string;
  status: "processing" | "shipped" | "delivered";
  deliveredOn?: string;
  eta?: string;
  carrier: string;
  address: string;
  items: Item[];
}

export const TODAY = "2026-09-24";
export const RETURN_WINDOW_DAYS = 30;

export const ORDERS: Order[] = [
  {
    id: "PC-10421",
    customerId: "c1",
    placedOn: "2026-09-10",
    status: "delivered",
    deliveredOn: "2026-09-14",
    carrier: "UPS",
    address: "18 Hayes St, San Francisco, CA 94102",
    items: [
      { id: "i-101", name: "Aurora ANC Headphones", variant: "Midnight Black", price: 249 },
      { id: "i-102", name: "Braided USB-C Cable", variant: "2 m", price: 19 },
    ],
  },
  {
    id: "PC-10588",
    customerId: "c1",
    placedOn: "2026-09-19",
    status: "shipped",
    eta: "2026-09-26",
    carrier: "FedEx",
    address: "18 Hayes St, San Francisco, CA 94102",
    items: [
      {
        id: "i-103",
        name: "Trailline Rain Jacket",
        variant: "Olive, M",
        price: 139,
        sizes: ["S", "M", "L", "XL"],
      },
    ],
  },
  {
    id: "PC-10612",
    customerId: "c1",
    placedOn: "2026-09-22",
    status: "processing",
    eta: "2026-09-29",
    carrier: "UPS",
    address: "18 Hayes St, San Francisco, CA 94102",
    items: [{ id: "i-104", name: "Pour-Over Coffee Set", variant: "Ceramic", price: 64 }],
  },
  {
    id: "PC-20107",
    customerId: "c2",
    placedOn: "2026-09-08",
    status: "delivered",
    deliveredOn: "2026-09-12",
    carrier: "DHL",
    address: "42 Residency Rd, Bengaluru 560025",
    items: [
      {
        id: "i-201",
        name: "Stride Running Shoes",
        variant: "Blue, UK 9",
        price: 129,
        sizes: ["UK 8", "UK 9", "UK 10", "UK 11"],
      },
      { id: "i-202", name: "Merino Running Socks", variant: "3-pack", price: 24 },
    ],
  },
  {
    id: "PC-20391",
    customerId: "c2",
    placedOn: "2026-09-21",
    status: "shipped",
    eta: "2026-09-27",
    carrier: "Blue Dart",
    address: "42 Residency Rd, Bengaluru 560025",
    items: [{ id: "i-204", name: "Studio Desk Lamp", variant: "Warm white", price: 89 }],
  },
  {
    id: "PC-30056",
    customerId: "c3",
    placedOn: "2026-09-05",
    status: "delivered",
    deliveredOn: "2026-09-09",
    carrier: "USPS",
    address: "7 Calle Luna, Austin, TX 78701",
    items: [{ id: "i-301", name: "Linen Duvet Cover", variant: "Queen, Sand", price: 179 }],
  },
  {
    id: "PC-30219",
    customerId: "c3",
    placedOn: "2026-09-17",
    status: "delivered",
    deliveredOn: "2026-09-21",
    carrier: "USPS",
    address: "7 Calle Luna, Austin, TX 78701",
    items: [
      {
        id: "i-303",
        name: "Trailline Hiking Boots",
        variant: "Brown, US 8",
        price: 189,
        sizes: ["US 7", "US 8", "US 9", "US 10"],
      },
    ],
  },
  {
    id: "PC-30402",
    customerId: "c3",
    placedOn: "2026-09-22",
    status: "processing",
    eta: "2026-09-28",
    carrier: "USPS",
    address: "7 Calle Luna, Austin, TX 78701",
    items: [{ id: "i-304", name: "Cast Iron Skillet", variant: "12 in", price: 59 }],
  },
];

// Writes from Mutations. Kept on globalThis so dev reloads keep them.
const g = globalThis as {
  deskWrites?: { returned: Set<string>; cancelled: Set<string>; addresses: Map<string, string> };
};
export const writes = (g.deskWrites ??= {
  returned: new Set(),
  cancelled: new Set(),
  addresses: new Map(),
});

export function resetWrites() {
  writes.returned.clear();
  writes.cancelled.clear();
  writes.addresses.clear();
}

export function customerName(customerId: string) {
  return CUSTOMERS.find((c) => c.id === customerId)?.name ?? "";
}

export function itemsOf(customerId: string) {
  return ORDERS.filter((o) => o.customerId === customerId).flatMap((order) =>
    order.items.map((item) => ({ item, order })),
  );
}

/** Values that belong to one customer and so must never be written into a saved screen. */
export function customerValues(): string[] {
  return [
    ...CUSTOMERS.flatMap((c) => [c.name, c.name.split(" ")[0]]),
    ...ORDERS.flatMap((o) => [o.id, o.address, ...o.items.map((i) => i.name)]),
  ];
}
