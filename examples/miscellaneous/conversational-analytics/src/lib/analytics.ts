import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { filterSchema, periodFor } from "./filters";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const integer = new Intl.NumberFormat("en-GB");
const money = (units: number) => currency.format(units / 10000);
const percentage = (now: number, before: number) =>
  before === 0
    ? "No previous sales"
    : `${((now / before - 1) * 100).toFixed(1)}% vs previous month`;

export function openDatabase() {
  const path = resolve(process.cwd(), "data/retail.sqlite");
  if (!existsSync(path))
    throw new Error("Dataset not prepared. Run python scripts/prepare_data.py, then retry.");
  return new DatabaseSync(path, { readOnly: true });
}

export function queryDashboard(db: DatabaseSync, input: unknown) {
  const { month, country } = filterSchema.parse(input);
  const countries = (
    db.prepare("SELECT DISTINCT country FROM sales ORDER BY country").all() as { country: string }[]
  ).map((row) => row.country);
  if (country !== "All countries" && !countries.includes(country))
    throw new RangeError("Choose a country present in the dataset.");
  const { previous, start, end } = periodFor(month);
  const scope = country === "All countries" ? "" : " AND country = ?";
  const params = country === "All countries" ? [] : [country];
  const totals = (from: string, to: string) =>
    db
      .prepare(
        `
    SELECT COALESCE(SUM(sales_units), 0) AS sales, COUNT(DISTINCT invoice) AS orders,
           COALESCE(SUM(quantity), 0) AS units
    FROM sales WHERE day >= ? AND day < ?${scope}
  `,
      )
      .get(from, to, ...params) as { sales: number; orders: number; units: number };
  const current = totals(start, end);
  const prior = totals(previous, start);
  const daily = db
    .prepare(
      `
    SELECT day, SUM(sales_units) AS sales FROM sales
    WHERE day >= ? AND day < ?${scope} GROUP BY day ORDER BY day
  `,
    )
    .all(start, end, ...params) as { day: string; sales: number }[];
  const byDay = new Map(daily.map((row) => [row.day, row.sales / 10000]));
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86400000);
  const trend = Array.from({ length: days }, (_, i) => {
    const day = `${month}-${String(i + 1).padStart(2, "0")}`;
    return { day, sales: byDay.get(day) ?? 0 };
  });
  // Compare the union of products sold in either month, including lost products.
  const products = db
    .prepare(
      `
    SELECT stock_code, MAX(description) AS description,
      SUM(CASE WHEN day >= ? THEN sales_units ELSE 0 END) AS current,
      SUM(CASE WHEN day < ? THEN sales_units ELSE 0 END) AS previous
    FROM sales WHERE day >= ? AND day < ?${scope}
    GROUP BY stock_code ORDER BY (current - previous) ASC, stock_code ASC LIMIT 10
  `,
    )
    .all(start, start, previous, end, ...params) as {
    stock_code: string;
    description: string;
    current: number;
    previous: number;
  }[];
  const title = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(start));
  const priorTitle = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(previous));
  const aov = current.orders ? current.sales / current.orders : 0;
  const priorAov = prior.orders ? prior.sales / prior.orders : 0;
  return {
    ready: true,
    empty: current.orders === 0,
    countries: ["All countries", ...countries],
    title: `${country} · ${title}`,
    comparison: `Compared with ${priorTitle}. Gross sales in GBP; cancellations, non-positive quantities and non-positive prices excluded.`,
    sales: money(current.sales),
    salesChange: percentage(current.sales, prior.sales),
    orders: integer.format(current.orders),
    ordersChange: percentage(current.orders, prior.orders),
    averageOrder: money(aov),
    averageOrderChange: percentage(aov, priorAov),
    summary:
      current.orders === 0
        ? "No eligible sales in this month and country. Choose another filter."
        : `Gross sales changed by ${money(current.sales - prior.sales)} from ${money(prior.sales)}. Orders changed from ${integer.format(prior.orders)} to ${integer.format(current.orders)}; average order value changed from ${money(priorAov)} to ${money(aov)}. These are observed differences, not evidence of what caused them.`,
    trend,
    products: products.map((row) => ({
      code: row.stock_code,
      name: row.description || row.stock_code,
      current: money(row.current),
      previous: money(row.previous),
      change: money(row.current - row.previous),
    })),
    // Numeric fields allow independent reproducibility checks, without parsing display strings.
    totals: {
      sales: current.sales / 10000,
      orders: current.orders,
      units: current.units,
      previousSales: prior.sales / 10000,
    },
  };
}
