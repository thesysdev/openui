import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { openDatabase, querySales } from "../src/lib/analytics";

const manifest = JSON.parse(readFileSync("data/manifest.json", "utf8"));
assert.equal(manifest.source_rows, 541909);
assert.equal(manifest.eligible_rows, 530104);
const db = openDatabase();
try {
  const all = querySales(db, { month: "2011-02", country: "All countries" });
  assert.deepEqual(all.totals, {
    sales: 523631.89,
    orders: 1100,
    units: 283555,
    previousSales: 691364.56,
  });
  const germany = querySales(db, { month: "2011-02", country: "Germany" });
  assert.deepEqual(germany.totals, {
    sales: 9581.05,
    orders: 19,
    units: 4245,
    previousSales: 16910.84,
  });
  assert.equal(querySales(db, { month: "2011-04", country: "Saudi Arabia" }).empty, true);
  console.log(
    "UCI import and cookbook totals verified for all countries, Germany, and an empty period.",
  );
} finally {
  db.close();
}
