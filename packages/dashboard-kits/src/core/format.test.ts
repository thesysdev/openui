import { describe, expect, it } from "vitest";
import { formatCurrency, formatDuration, formatNumber } from "./format";

describe("formatDuration", () => {
  it.each([
    [6.2, "6m 12s"],
    [0, "0m 00s"],
    [6.995, "7m 00s"],
    [6.99, "6m 59s"],
    [59.99, "59m 59s"],
    [59.995, "1.0 h"],
    [90, "1.5 h"],
    [1439.9, "1.0 days"],
    [60 * 24 * 2, "2.0 days"],
    [-2.5, "−2m 30s"],
    [-6.995, "−7m 00s"],
    [-90, "−1.5 h"],
    [-0.001, "0m 00s"],
  ])("%s minutes → %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe("formatCurrency", () => {
  it.each([
    [12.5, "$12.50"],
    [999, "$999"],
    [999.996, "$1,000"],
    [1_234.4, "$1,234"],
    [9_999.4, "$9,999"],
    [9_999.6, "$10.0K"],
    [12_345, "$12.3K"],
    [999_949, "$999.9K"],
    [999_999.99, "$1.00M"],
    [3_630_000, "$3.63M"],
    [-999_999.99, "−$1.00M"],
    [-12_345, "−$12.3K"],
  ])("%s → %s", (value, expected) => {
    expect(formatCurrency(value)).toBe(expected);
  });
});

describe("formatNumber", () => {
  it.each([
    [999.6, "1,000"],
    [9_999.4, "9,999"],
    [9_999.6, "10.0K"],
    [999_949, "999.9K"],
    [999_960, "1.00M"],
    [1_250_000, "1.25M"],
    [-999_960, "−1.00M"],
  ])("%s → %s", (value, expected) => {
    expect(formatNumber(value)).toBe(expected);
  });
});
