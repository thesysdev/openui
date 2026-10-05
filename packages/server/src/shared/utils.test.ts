import { parse } from "@openuidev/lang-core";
import { expect, it } from "vitest";
import { errorsOf } from "./utils";

const schema = new Map([["Card", { params: [{ name: "children", required: true }] }]]);

it("errorsOf ignores the no-root fallback warning but reports a missing entry", () => {
  expect(errorsOf(parse("page = Card([])", schema, "Card"))).toEqual([]);
  expect(errorsOf(parse("x = 1", schema, "Card")).map((e) => e.code)).toEqual([
    "no-root",
    "missing-root",
  ]);
});
