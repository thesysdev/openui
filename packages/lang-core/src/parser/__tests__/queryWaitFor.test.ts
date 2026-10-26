import { describe, expect, it } from "vitest";
import { parse } from "../parser";
import type { ParamMap } from "../types";

const schema: ParamMap = new Map([["Title", { params: [{ name: "text", required: true }] }]]);
const queries = (source: string) => {
  const result = parse(`root = Title("t")\n${source}`, schema);
  return { result, by: Object.fromEntries(result.queryStatements.map((q) => [q.statementId, q])) };
};

describe("Query waitFor", () => {
  it("lists the queries whose results the tool name or args read, directly or through statements", () => {
    const { result, by } = queries(
      'cust = Query("customers", {}, [])\nids = cust.id\norders = Query("orders", {ids: ids, n: @Count(cust)}, [])\nother = Query("x", {}, [])',
    );
    expect(result.meta.errors).toEqual([]);
    expect(by.orders.waitFor).toEqual(["cust"]);
    expect(by.cust.waitFor).toBeUndefined();
    expect(by.other.waitFor).toBeUndefined();
  });
  it("does not wait on a query read only in the defaults", () => {
    const { by } = queries('a = Query("a", {}, [])\nb = Query("b", {}, a)');
    expect(by.b.waitFor).toBeUndefined();
  });
  it("reports queries that read each other, including a query that reads itself", () => {
    const { result } = queries(
      'a = Query("ta", {x: b}, [])\nb = Query("tb", {x: a}, [])\nc = Query("tc", {x: c}, [])',
    );
    expect(result.meta.errors).toEqual([
      expect.objectContaining({ code: "query-cycle", statementId: "a" }),
      expect.objectContaining({ code: "query-cycle", statementId: "c" }),
    ]);
  });
});
