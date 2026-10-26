import { formatCurrency, formatNumber } from "../../../core/format";
import { between, dateLabel, downsample, round, sum } from "../../../core/sample-data";
import type { Range } from "../../../core/schemas";
import { STORE_EVENTS } from "../calendar";
import { adSpendDaily } from "./profit";
import { type CustomerType, STOREFRONT, channelsFor, current, previous } from "./store";

// Products and inventory: the catalog, each product's sales, stock, days of
// cover, reorders, and stock status.

const PRODUCTS = [
  {
    sku: "APP-TEE-01",
    name: "Everyday Crew Tee",
    category: "apparel",
    price: 32,
    weight: 1.6,
    cart: 0.16,
    ret: 0.09,
    margin: 0.62,
  },
  {
    sku: "APP-SWT-02",
    name: "Merino Crew Sweater",
    category: "apparel",
    price: 98,
    weight: 0.9,
    cart: 0.11,
    ret: 0.12,
    margin: 0.57,
  },
  {
    sku: "APP-OVS-03",
    name: "Linen Overshirt",
    category: "apparel",
    price: 78,
    weight: 0.7,
    cart: 0.1,
    ret: 0.13,
    margin: 0.56,
  },
  {
    sku: "APP-HOO-04",
    name: "Organic Cotton Hoodie",
    category: "apparel",
    price: 88,
    weight: 1.0,
    cart: 0.12,
    ret: 0.1,
    margin: 0.58,
  },
  {
    sku: "APP-CHN-05",
    name: "Relaxed Chino",
    category: "apparel",
    price: 84,
    weight: 0.6,
    cart: 0.09,
    ret: 0.16,
    margin: 0.55,
  },
  {
    sku: "FTW-TRL-01",
    name: "Trail Runner 2",
    category: "footwear",
    price: 138,
    weight: 1.1,
    cart: 0.13,
    ret: 0.12,
    margin: 0.47,
  },
  {
    sku: "FTW-CNV-02",
    name: "Canvas Low",
    category: "footwear",
    price: 68,
    weight: 1.2,
    cart: 0.14,
    ret: 0.11,
    margin: 0.49,
  },
  {
    sku: "FTW-DBT-03",
    name: "Suede Desert Boot",
    category: "footwear",
    price: 168,
    weight: 0.45,
    cart: 0.08,
    ret: 0.19,
    margin: 0.45,
  },
  {
    sku: "FTW-SLD-04",
    name: "Weekend Slide",
    category: "footwear",
    price: 42,
    weight: 0.7,
    cart: 0.12,
    ret: 0.07,
    margin: 0.51,
  },
  {
    sku: "ACC-TOT-01",
    name: "Canvas Tote",
    category: "accessories",
    price: 38,
    weight: 1.0,
    cart: 0.17,
    ret: 0.02,
    margin: 0.67,
  },
  {
    sku: "ACC-WAL-02",
    name: "Leather Card Wallet",
    category: "accessories",
    price: 52,
    weight: 0.8,
    cart: 0.14,
    ret: 0.03,
    margin: 0.66,
  },
  {
    sku: "ACC-BEA-03",
    name: "Wool Beanie",
    category: "accessories",
    price: 28,
    weight: 0.9,
    cart: 0.18,
    ret: 0.02,
    margin: 0.64,
  },
  {
    sku: "ACC-CAP-04",
    name: "Sunday Cap",
    category: "accessories",
    price: 34,
    weight: 0.7,
    cart: 0.15,
    ret: 0.04,
    margin: 0.65,
  },
  {
    sku: "HOM-MUG-01",
    name: "Stoneware Mug Set",
    category: "home",
    price: 46,
    weight: 0.8,
    cart: 0.13,
    ret: 0.05,
    margin: 0.6,
  },
  {
    sku: "HOM-THR-02",
    name: "Linen Throw",
    category: "home",
    price: 112,
    weight: 0.55,
    cart: 0.09,
    ret: 0.04,
    margin: 0.61,
  },
  {
    sku: "HOM-CDL-03",
    name: "Soy Candle Trio",
    category: "home",
    price: 36,
    weight: 0.9,
    cart: 0.16,
    ret: 0.03,
    margin: 0.63,
  },
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  apparel: "Apparel",
  footwear: "Footwear",
  accessories: "Accessories",
  home: "Home",
};

/** The calendar's stockout for a product, if it has one. */
const stockoutOf = (name: string) =>
  STORE_EVENTS.find((e) => e.kind === "stockout" && e.label.startsWith(name));

export function productSales(range: Range, channel: string, type: CustomerType = "all") {
  const chs = channelsFor(channel);
  const storefront = chs.filter((c) => STOREFRONT.includes(c));
  // New customers start with the cheaper products; returning ones trade up.
  const tilt = (price: number) =>
    type === "new" ? (40 / price) ** 0.35 : type === "returning" ? (price / 40) ** 0.2 : 1;
  const weights = PRODUCTS.map(
    (p) => p.weight * tilt(p.price) * between(`w:${p.sku}:${channel}`, 0.85, 1.15),
  );
  const totalWeight = sum(weights);
  const orderDays = current(chs, "orders", range, type);
  const units = sum(orderDays) * 1.62;
  const prevUnits = sum(previous(chs, "orders", range, type)) * 1.62;
  const discountRate =
    sum(current(chs, "discounts", range, type)) / sum(current(chs, "gross", range, type));
  const prevDiscountRate =
    sum(previous(chs, "discounts", range, type)) / sum(previous(chs, "gross", range, type));
  const storefrontShare = storefront.length
    ? sum(current(storefront, "orders", range, type)) / sum(current(chs, "orders", range, type))
    : 0;
  const views = storefront.length ? sum(current(storefront, "sessions", range, type)) * 0.565 : 0;
  // A sold-out product sells nothing on its days out (index d is days − 1 − d ago).
  const inStock = PRODUCTS.map((p) => {
    const out = stockoutOf(p.name);
    return orderDays.map((_, d) => {
      const ago = orderDays.length - 1 - d;
      return out && ago <= out.from && ago >= out.to ? 0 : 1;
    });
  });
  const raw = PRODUCTS.map((p, i) => {
    const u =
      (units *
        weights[i] *
        between(`s:${p.sku}:${range}:${channel}`, 0.88, 1.18) *
        (sum(orderDays.map((o, d) => o * inStock[i][d])) / sum(orderDays))) /
      totalWeight;
    const pu =
      (prevUnits * weights[i] * between(`p:${p.sku}:${range}:${channel}`, 0.9, 1.1)) / totalWeight;
    return {
      units: u,
      revenue: u * p.price * (1 - discountRate) * (1 - p.ret),
      prevRevenue: pu * p.price * (1 - prevDiscountRate) * (1 - p.ret),
    };
  });
  // Product revenue is net sales, so the products add up to the store's net sales.
  const scale = sum(current(chs, "net", range, type)) / sum(raw.map((r) => r.revenue));
  const prevScale = sum(previous(chs, "net", range, type)) / sum(raw.map((r) => r.prevRevenue));
  return PRODUCTS.map((p, i) => {
    const u = Math.round(raw[i].units * scale);
    const revenue = raw[i].revenue * scale;
    const prevRevenue = raw[i].prevRevenue * prevScale;
    const v = Math.round((views * weights[i] * between(`v:${p.sku}`, 0.85, 1.15)) / totalWeight);
    const addToCartRate = p.cart * between(`c:${p.sku}:${range}`, 0.9, 1.1);
    const purchases = (u * storefrontShare) / 1.15;
    const unitsDaily = orderDays.map(
      (o, d) =>
        ((o * 1.62 * weights[i] * scale * inStock[i][d]) / totalWeight) *
        between(`d:${p.sku}:${d}`, 0.75, 1.25),
    );
    return {
      ...p,
      units: u,
      trend: downsample(unitsDaily, 14).map((v) => round(v)),
      revenue: round(revenue, 2),
      change: round(((revenue - prevRevenue) / prevRevenue) * 100),
      ...(v > 0
        ? {
            views: v,
            addToCartRate: round(addToCartRate, 4),
            conversionRate: round(Math.min(purchases / v, addToCartRate * 0.55), 4),
          }
        : {}),
      returnRate: round(p.ret * between(`r:${p.sku}:${range}`, 0.9, 1.1), 4),
    };
  });
}

/** Days of cover each product has today; a few are deliberately tight. */
const STOCK_PLAN: Record<string, { cover?: number; incoming?: number; inDays?: number }> = {
  "FTW-TRL-01": { cover: 5.8, incoming: 1200, inDays: 9 },
  "ACC-BEA-03": { cover: 0, incoming: 800, inDays: 4 },
  "HOM-THR-02": { cover: 9.5 },
  "APP-SWT-02": { cover: 12, incoming: 600, inDays: 15 },
  "FTW-CNV-02": { cover: 17 },
};

let inventoryCache: ReturnType<typeof buildInventory> | undefined;
export const inventory = () => (inventoryCache ??= buildInventory());

/** Days from placing a purchase order to stock on the shelf, and the safety stock on top. */
export const LEAD_TIME = 14;
export const SAFETY_DAYS = 7;

function buildInventory() {
  const sales = productSales("30d", "all");
  const net = sum(sales.map((p) => p.revenue));
  const adsPerDay = sum(adSpendDaily(30, 0).paid) / 30;
  return sales.map((p) => {
    const plan = STOCK_PLAN[p.sku] ?? {};
    // Velocity counts only the days the product was in stock, so a sold-out
    // product isn't mistaken for a slow one.
    const out = stockoutOf(p.name);
    const daysOut = out ? out.from - out.to + 1 : 0;
    const dailySales = p.units / (30 - daysOut);
    const unitRevenue = p.revenue / Math.max(1, p.units);
    const cover = plan.cover ?? between(`cover:${p.sku}`, 26, 75);
    const stock = Math.round(dailySales * cover);
    const reorderPoint = Math.round(dailySales * (LEAD_TIME + SAFETY_DAYS));
    const incoming = plan.incoming ?? 0;
    const suggested = Math.max(0, Math.ceil((dailySales * 45 - stock - incoming) / 50) * 50);
    // An open order counts toward cover: the next order is due when stock on
    // hand plus what's already ordered runs down to lead time plus safety.
    const orderIn = Math.floor((stock + incoming) / dailySales - LEAD_TIME - SAFETY_DAYS);
    // Days with nothing to sell: until the open order lands, or a new order would.
    const landsIn = plan.inDays ?? LEAD_TIME;
    const gap = Math.max(0, landsIn - stock / dailySales);
    return {
      sku: p.sku,
      name: p.name,
      category: p.category,
      unitCost: p.price * (1 - p.margin),
      stock,
      reorderPoint,
      dailySales: round(dailySales),
      daysOfCover: round(stock / dailySales),
      ...(incoming ? { incoming, incomingInDays: plan.inDays } : {}),
      ...(suggested ? { suggestedOrder: suggested } : {}),
      replenishBy: orderIn > 0 ? dateLabel(-orderIn) : "Now",
      ...(orderIn < 0 ? { daysLate: -orderIn } : {}),
      stockoutGapDays: round(gap),
      revenueAtRisk: Math.round(gap * dailySales * unitRevenue),
      ...(daysOut ? { lostRevenue: Math.round(daysOut * dailySales * unitRevenue) } : {}),
      adSpendPerDay: Math.round((p.revenue / net) * adsPerDay),
    };
  });
}

/** Cover above this many days ties up cash: a candidate to discount rather than reorder. */
const SLOW_COVER = 60;

/**
 * Every SKU's stock health, most urgent first: ABC class by its share of the
 * last 30 days' revenue (A up to 80% cumulative, B to 95%, C the rest), days
 * of cover against the reorder point (lead time plus safety stock), a status,
 * and what to do about it. Plus a sentence on how concentrated revenue is.
 */
export function inventoryCatalog(items: ReturnType<typeof inventory>) {
  const revenue = new Map(productSales("30d", "all").map((p) => [p.sku, p.revenue]));
  const ranked = [...items].sort((a, b) => (revenue.get(b.sku) ?? 0) - (revenue.get(a.sku) ?? 0));
  const total = sum(ranked.map((i) => revenue.get(i.sku) ?? 0)) || 1;
  let running = 0;
  const abc = new Map(
    ranked.map((i) => {
      const before = running / total;
      running += revenue.get(i.sku) ?? 0;
      return [i.sku, before < 0.8 ? "A" : before < 0.95 ? "B" : "C"] as const;
    }),
  );
  const rank = { "Out of stock": 0, "Reorder now": 1, "Slow mover": 2, Healthy: 3 } as const;
  const catalog = items
    .map((i) => {
      const status: keyof typeof rank =
        i.stock === 0
          ? "Out of stock"
          : i.stock < i.reorderPoint
            ? "Reorder now"
            : i.daysOfCover > SLOW_COVER
              ? "Slow mover"
              : "Healthy";
      return {
        name: i.name,
        sku: i.sku,
        category: CATEGORY_LABELS[i.category] ?? i.category,
        abc: abc.get(i.sku)!,
        revenue: Math.round(revenue.get(i.sku) ?? 0),
        stock: i.stock,
        dailySales: i.dailySales,
        daysOfCover: i.daysOfCover,
        reorderAt: LEAD_TIME + SAFETY_DAYS,
        status,
        action:
          status === "Out of stock"
            ? i.incoming
              ? `Expedite PO (${formatNumber(i.incoming)} units)`
              : "Order now"
            : status === "Reorder now"
              ? i.incoming
                ? `PO lands in ${i.incomingInDays} days`
                : `Order ${formatNumber(i.suggestedOrder ?? 0)}`
              : status === "Slow mover"
                ? `Discount: ${formatCurrency(i.stock * i.unitCost)} at cost`
                : "",
      };
    })
    .sort((a, b) => rank[a.status] - rank[b.status] || b.revenue - a.revenue);
  const aSkus = catalog.filter((c) => c.abc === "A");
  const aShort = aSkus.filter((c) => c.status === "Out of stock" || c.status === "Reorder now");
  return {
    catalog,
    concentration: `${aSkus.length} of ${catalog.length} products make 80% of the last 30 days' revenue${aShort.length ? `; ${aShort.length} of them ${aShort.length === 1 ? "is" : "are"} below the reorder point` : ""}.`,
  };
}

export function stockStatus(sku: string): "In stock" | "Low stock" | "Out of stock" {
  const item = inventory().find((i) => i.sku === sku);
  if (!item || item.stock === 0) return "Out of stock";
  return item.stock < item.reorderPoint ? "Low stock" : "In stock";
}
