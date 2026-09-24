import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { queryDashboard } from "../src/lib/analytics";
import { filterSchema, periodFor } from "../src/lib/filters";

function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec(
    "CREATE TABLE sales (invoice TEXT, stock_code TEXT, description TEXT, quantity INTEGER, day TEXT, country TEXT, sales_units INTEGER)",
  );
  const insert = db.prepare("INSERT INTO sales VALUES (?, ?, ?, ?, ?, ?, ?)");
  insert.run("old", "LOST", "Previous-only product", 1, "2011-01-31", "Germany", 300000);
  insert.run("new", "A", "First product", 2, "2011-02-01", "Germany", 100000);
  insert.run("new", "B", "Second product", 1, "2011-02-01", "Germany", 50000);
  insert.run("fr", "A", "First product", 1, "2011-02-28", "France", 125000);
  insert.run("next", "A", "First product", 1, "2011-03-01", "Germany", 9990000);
  return db;
}

test("aggregates invoice lines, counts distinct orders, and respects calendar/country boundaries", () => {
  const db = fixture();
  try {
    const result = queryDashboard(db, { month: "2011-02", country: "Germany" });
    assert.deepEqual(result.totals, { sales: 15, orders: 1, units: 3, previousSales: 30 });
    assert.equal(result.averageOrder, "£15.00");
    assert.equal(result.salesChange, "-50.0% vs previous month");
    assert.equal(result.trend.length, 28);
    assert.equal(result.trend[0].sales, 15);
    assert.equal(result.trend[1].sales, 0);
    assert.equal(result.products[0].code, "LOST");
    assert.equal(result.products[0].change, "-£30.00");
    assert.equal(
      queryDashboard(db, { month: "2011-02", country: "All countries" }).totals.sales,
      27.5,
    );
  } finally {
    db.close();
  }
});

test("empty results and zero baselines are explicit", () => {
  const db = fixture();
  try {
    const empty = queryDashboard(db, { month: "2011-04", country: "France" });
    assert.equal(empty.empty, true);
    assert.equal(empty.salesChange, "No previous sales");
    assert.equal(empty.averageOrder, "£0.00");
    assert.equal(empty.products.length, 0);
    assert.ok(empty.trend.every((day) => day.sales === 0));
  } finally {
    db.close();
  }
});

test("rejects incomplete dates, extra query fields and SQL-like country input", () => {
  for (const month of ["2011-12", "2010-12", "2011-2", "2026-02"]) {
    assert.equal(filterSchema.safeParse({ month, country: "Germany" }).success, false);
  }
  assert.equal(
    filterSchema.safeParse({ month: "2011-02", country: "Germany", sql: "DROP TABLE sales" })
      .success,
    false,
  );
  assert.deepEqual(periodFor("2011-01"), {
    previous: "2010-12-01",
    start: "2011-01-01",
    end: "2011-02-01",
  });
  const db = fixture();
  try {
    assert.throws(
      () => queryDashboard(db, { month: "2011-02", country: "Germany' OR 1=1 --" }),
      RangeError,
    );
    assert.equal(queryDashboard(db, { month: "2011-02", country: "Germany" }).totals.sales, 15);
  } finally {
    db.close();
  }
});
