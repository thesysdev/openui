import { between, bucket, dayLabels, random, RANGE_DAYS, sum } from "../../core/sample-data";
import type { Item, Range } from "../../core/schemas";
import { COUNTRIES } from "./helpers";
import { DEVICES } from "./journeys";
import { CATEGORY_LABELS, productSales } from "./products";
import { items } from "./profit";
import {
  CHANNELS,
  channelsFor,
  current,
  previous,
  STOREFRONT,
  type Channel,
  type CustomerType,
  type Input,
} from "./store";

// Sales split by a dimension (channel, product, category, device, country) and
// over time.

export function salesBy({ range, channel, dimension, customerType: type }: Input<"get_sales_by">) {
  const chs = channelsFor(channel);
  if (dimension === "channel") {
    const all = Object.keys(CHANNELS) as Channel[];
    const names = all.map((c) => CHANNELS[c].label);
    const totals = all.map((c) => sum(current([c], "total", range, type)));
    return {
      labels: names,
      totalSales: totals.map(Math.round),
      orders: all.map((c) => Math.round(sum(current([c], "orders", range, type)))),
      items: items(
        names,
        totals,
        all.map((c) => sum(previous([c], "total", range, type))),
        all,
      ),
    };
  }
  if (dimension === "category") {
    const products = productSales(range, channel, type);
    const categories = Object.keys(CATEGORY_LABELS);
    const totalRatio =
      sum(current(chs, "total", range, type)) / sum(current(chs, "net", range, type));
    const totals = categories.map(
      (c) => sum(products.filter((p) => p.category === c).map((p) => p.revenue)) * totalRatio,
    );
    const previousTotals = categories.map(
      (c) =>
        sum(products.filter((p) => p.category === c).map((p) => p.revenue / (1 + p.change / 100))) *
        totalRatio,
    );
    return {
      labels: categories.map((c) => CATEGORY_LABELS[c]),
      items: items(
        categories.map((c) => CATEGORY_LABELS[c]),
        totals,
        previousTotals,
        categories,
      ),
      totalSales: totals.map(Math.round),
      orders: categories.map((c) =>
        Math.round(sum(products.filter((p) => p.category === c).map((p) => p.units)) / 1.62),
      ),
    };
  }
  if (dimension === "device") {
    const storefront = chs.filter((c) => STOREFRONT.includes(c));
    // Devices are tracked on the store and app only: Amazon alone has no split,
    // rather than three parts of zero with no share between them.
    if (!storefront.length) return { labels: [], items: [], totalSales: [], orders: [] };
    const sales = sum(current(storefront, "total", range, type));
    const orders = sum(current(storefront, "orders", range, type));
    const devices = Object.values(DEVICES);
    const weight = sum(devices.map((d) => d.orders * d.aov));
    const prevSales = sum(previous(storefront, "total", range, type));
    const totals = devices.map((d) => (sales * d.orders * d.aov) / weight);
    return {
      labels: devices.map((d) => d.label),
      items: items(
        devices.map((d) => d.label),
        totals,
        devices.map((d, i) => ((prevSales * d.orders * d.aov) / weight) * (i === 1 ? 0.97 : 1.02)),
        Object.keys(DEVICES),
      ),
      totalSales: totals.map(Math.round),
      orders: devices.map((d) => Math.round(orders * d.orders)),
    };
  }
  const sales = sum(current(chs, "total", range, type));
  const orders = sum(current(chs, "orders", range, type));
  const shares = COUNTRIES.map(
    (c) => c.share * between(`country:${c.label}:${range}:${channel}`, 0.9, 1.1),
  );
  const total = sum(shares);
  const prevSales = sum(previous(chs, "total", range, type));
  return {
    labels: COUNTRIES.map((c) => c.label),
    items: items(
      COUNTRIES.map((c) => c.label),
      shares.map((s) => (sales * s) / total),
      shares.map((s, i) => ((prevSales * s) / total) * between(`cp:${i}:${range}`, 0.92, 1.06)),
    ),
    totalSales: shares.map((s) => Math.round((sales * s) / total)),
    orders: shares.map((s) => Math.round((orders * s) / total)),
  };
}

/**
 * The period's daily sales split by a breakdown's parts. Each part drifts by its
 * change over the period, days add up to the store's total, and each part's
 * days add up to its item value.
 */
export function splitOverTime(range: Range, chs: Channel[], parts: Item[], type: CustomerType) {
  const days = RANGE_DAYS[range];
  const daily = current(chs, "total", range, type);
  const total = sum(parts.map((p) => p.value)) || 1;
  const raw = parts.map((p) => {
    const next = random(`split:${p.name}:${range}`);
    return daily.map(
      (_, i) =>
        (p.value / total) * (1 + ((p.change ?? 0) / 100) * (i / days - 0.5)) * (0.8 + next() * 0.4),
    );
  });
  const perDay = daily.map((v, i) => {
    const dayTotal = sum(raw.map((r) => r[i])) || 1;
    return raw.map((r) => (v * r[i]) / dayTotal);
  });
  const split = parts.map((p, k) => {
    const values = perDay.map((d) => d[k]);
    const scale = p.value / (sum(values) || 1);
    return values.map((v) => v * scale);
  });
  const { labels, values } = bucket(dayLabels(days), split, range);
  return {
    labels,
    series: parts.map((p, k) => ({ name: p.name, values: values[k].map(Math.round) })),
  };
}
