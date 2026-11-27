import { describe, expect, it } from "vitest";
import { caught } from "../__tests__/fake-fetch";
import { idPath, queryNumber, requireId, toList } from "./resource";

describe("toList", () => {
  it("maps each row and reads the page fields", () => {
    const page = { data: [1, 2], has_more: true, first_id: "a", last_id: "b" };
    expect(toList(page, (row) => Number(row) * 10)).toEqual({
      data: [10, 20],
      hasMore: true,
      firstId: "a",
      lastId: "b",
    });
  });

  it("has no more pages unless has_more is true, and skips missing ids", () => {
    expect(toList({ data: [], has_more: "yes" }, (row) => row)).toEqual({
      data: [],
      hasMore: false,
    });
  });

  it("rejects a page without data", async () => {
    expect(await caught(() => toList({}, (row) => row))).toMatchObject({
      code: "invalid_response",
      status: 502,
    });
  });
});

describe("idPath", () => {
  it("encodes the id and adds the suffix", () => {
    expect(idPath("artifacts", "a/1 2", "/pin")).toBe("/v1/artifacts/a%2F1%202/pin");
  });

  it.each([undefined, "", 5])("rejects the id %j", async (id) => {
    expect(await caught(() => idPath("artifacts", id))).toMatchObject({
      code: "invalid_input",
      message: "id is required",
    });
  });
});

describe("requireId", () => {
  it("returns the id, or names the missing field", async () => {
    expect(requireId("i1", "itemId")).toBe("i1");
    expect(await caught(() => requireId("", "itemId"))).toMatchObject({
      message: "itemId is required",
    });
  });
});

describe("queryNumber", () => {
  it("turns a number into a query value and leaves out undefined", () => {
    expect(queryNumber(20)).toBe("20");
    expect(queryNumber(0)).toBe("0");
    expect(queryNumber(undefined)).toBeUndefined();
  });
});
