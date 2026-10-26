import { describe, expect, it } from "vitest";
import { bucket, dailySeries, dayLabels, eventSpan, sum } from "./sample-data";

describe("bucket", () => {
  const days = dayLabels(90);
  const series = dailySeries("bucket-test", 90, 1_000);

  it("keeps the oldest days that don't fill a week as a short first week", () => {
    const { labels, values } = bucket(days, [series], "90d");
    expect(labels).toHaveLength(13);
    expect(labels[0]).toBe(`Wk of ${days[0]}`);
    expect(labels[1]).toBe(`Wk of ${days[6]}`);
    expect(labels.at(-1)).toBe(`Wk of ${days[83]}`);
    expect(values[0]![0]).toBeCloseTo(sum(series.slice(0, 6)));
    expect(values[0]![12]).toBeCloseTo(sum(series.slice(83)));
  });

  it("sums to the period's total, for every series", () => {
    const other = dailySeries("bucket-other", 90, 40);
    const { values } = bucket(days, [series, other], "90d");
    expect(sum(values[0]!)).toBeCloseTo(sum(series), 6);
    expect(sum(values[1]!)).toBeCloseTo(sum(other), 6);
  });

  it("has no short week when the days fill whole weeks", () => {
    const labels = dayLabels(84);
    const { labels: weeks, values } = bucket(labels, [series.slice(6)], "90d");
    expect(weeks).toHaveLength(12);
    expect(weeks[0]).toBe(`Wk of ${labels[0]}`);
    expect(sum(values[0]!)).toBeCloseTo(sum(series.slice(6)), 6);
  });

  it("averages each week, the short one over its own days", () => {
    const { values } = bucket(days, [series], "90d", true);
    expect(values[0]![0]).toBeCloseTo(sum(series.slice(0, 6)) / 6);
    expect(values[0]![1]).toBeCloseTo(sum(series.slice(6, 13)) / 7);
  });

  it("leaves shorter ranges day by day", () => {
    const labels = dayLabels(30);
    expect(bucket(labels, [series.slice(0, 30)], "30d")).toEqual({
      labels,
      values: [series.slice(0, 30)],
    });
  });
});

describe("eventSpan on weekly charts", () => {
  const { labels } = bucket(dayLabels(90), [dailySeries("span", 90, 1)], "90d");

  it("names the week bucket() put each day in", () => {
    // 89 days ago is the oldest day, in the short first week; 83 days ago starts the next.
    expect(eventSpan("90d", "e", 89, 84)).toMatchObject({ start: labels[0], end: labels[0] });
    expect(eventSpan("90d", "e", 83, 0)).toMatchObject({ start: labels[1], end: labels[12] });
    for (let daysAgo = 0; daysAgo < 90; daysAgo++) {
      const span = eventSpan("90d", "e", daysAgo, daysAgo)!;
      expect(labels).toContain(span.start);
    }
  });
});
