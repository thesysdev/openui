import { afterEach, describe, expect, it, vi } from "vitest";
import { createLegendStore } from "./legendStore";
import type { StackedLegendItem } from "./types";

const items = (n: number): StackedLegendItem[] =>
  Array.from({ length: n }, (_, i) => ({
    key: `k${i}`,
    label: `L${i}`,
    color: "#123456",
    value: i + 1,
  }));

const itemsFromKeys = (keys: string[]): StackedLegendItem[] =>
  keys.map((key, i) => ({ key, label: key, color: "#123456", value: i + 1 }));

afterEach(() => vi.restoreAllMocks());

describe("createLegendStore", () => {
  it("publish creates an entry with empty active/hidden", () => {
    const store = createLegendStore();
    store.getState().publish("a", items(2));
    expect(store.getState().entries["a"]!.items).toHaveLength(2);
    expect(store.getState().entries["a"]!.activeKey).toBeNull();
    expect(store.getState().entries["a"]!.hiddenKeys).toEqual([]);
  });

  it("publish preserves existing active/hidden across re-publish", () => {
    const store = createLegendStore();
    store.getState().publish("a", items(2));
    store.getState().setActive("a", "k1");
    store.getState().toggle("a", "k0");
    store.getState().publish("a", items(3));
    expect(store.getState().entries["a"]!.activeKey).toBe("k1");
    expect(store.getState().entries["a"]!.hiddenKeys).toEqual(["k0"]);
    expect(store.getState().entries["a"]!.items).toHaveLength(3);
  });

  it("publish reconciles hidden keys after a data swap — never leaves zero visible", () => {
    const store = createLegendStore();
    store.getState().publish("a", itemsFromKeys(["A", "B", "C"]));
    store.getState().toggle("a", "A"); // hide A → B, C visible
    store.getState().toggle("a", "B"); // hide B → C still visible
    expect(store.getState().entries["a"]!.hiddenKeys).toEqual(["A", "B"]);
    // Data swap drops C (the last-visible slice); only the previously-hidden
    // A, B survive. Reconciled: every survivor would be hidden → reset to all
    // visible so the chart never goes blank.
    store.getState().publish("a", itemsFromKeys(["A", "B"]));
    expect(store.getState().entries["a"]!.hiddenKeys).toEqual([]);
    expect(store.getState().entries["a"]!.items).toHaveLength(2);
  });

  it("publish drops a stale activeKey that no longer exists", () => {
    const store = createLegendStore();
    store.getState().publish("a", itemsFromKeys(["A", "B", "C"]));
    store.getState().setActive("a", "C");
    expect(store.getState().entries["a"]!.activeKey).toBe("C");
    store.getState().publish("a", itemsFromKeys(["A", "B"]));
    expect(store.getState().entries["a"]!.activeKey).toBeNull();
  });

  it("publish keeps a still-present hidden key on a normal re-publish", () => {
    const store = createLegendStore();
    store.getState().publish("a", itemsFromKeys(["A", "B", "C"]));
    store.getState().toggle("a", "A"); // hide A → B, C visible
    store.getState().publish("a", itemsFromKeys(["A", "B", "C", "D"]));
    // A still exists and ≥ 1 item stays visible → it remains hidden.
    expect(store.getState().entries["a"]!.hiddenKeys).toEqual(["A"]);
  });

  it("publish stores, updates, and preserves the format on the entry", () => {
    const store = createLegendStore();
    store.getState().publish("a", items(2), "number");
    expect(store.getState().entries["a"]!.format).toBe("number");
    // A re-publish with a new format updates it.
    store.getState().publish("a", items(2), "percentage");
    expect(store.getState().entries["a"]!.format).toBe("percentage");
    // A re-publish WITHOUT a format preserves the last one.
    store.getState().publish("a", items(2));
    expect(store.getState().entries["a"]!.format).toBe("percentage");
  });

  it("setActive / toggle are no-ops when key is absent", () => {
    const store = createLegendStore();
    store.getState().setActive("missing", "k0");
    store.getState().toggle("missing", "k0");
    expect(store.getState().entries["missing"]).toBeUndefined();
  });

  it("toggle flips membership", () => {
    const store = createLegendStore();
    store.getState().publish("a", items(2));
    store.getState().toggle("a", "k0");
    expect(store.getState().entries["a"]!.hiddenKeys).toEqual(["k0"]);
    store.getState().toggle("a", "k0");
    expect(store.getState().entries["a"]!.hiddenKeys).toEqual([]);
  });

  it("toggle keeps at least one item visible (cannot hide the last)", () => {
    const store = createLegendStore();
    store.getState().publish("a", items(2));
    // Hiding the first one is fine — one stays visible.
    store.getState().toggle("a", "k0");
    expect(store.getState().entries["a"]!.hiddenKeys).toEqual(["k0"]);
    // Hiding the second would blank the chart → blocked, no-op.
    store.getState().toggle("a", "k1");
    expect(store.getState().entries["a"]!.hiddenKeys).toEqual(["k0"]);
    // Un-hiding is always allowed even at the boundary.
    store.getState().toggle("a", "k0");
    expect(store.getState().entries["a"]!.hiddenKeys).toEqual([]);
  });

  it("keys are isolated — writing one does not touch another", () => {
    const store = createLegendStore();
    store.getState().publish("a", items(1));
    store.getState().publish("b", items(1));
    store.getState().setActive("a", "k0");
    expect(store.getState().entries["b"]!.activeKey).toBeNull();
  });

  it("unpublish removes the entry", () => {
    const store = createLegendStore();
    store.getState().publish("a", items(1));
    store.getState().unpublish("a");
    expect(store.getState().entries["a"]).toBeUndefined();
  });

  it("warns when a key gets a second publisher", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = createLegendStore();
    store.getState().registerPublisher("a");
    expect(warn).not.toHaveBeenCalled();
    store.getState().registerPublisher("a");
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]![0]).toContain("a");
  });

  it("unregisterPublisher resets the count so a fresh register warns again", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = createLegendStore();
    store.getState().registerPublisher("a");
    store.getState().unregisterPublisher("a");
    expect(warn).not.toHaveBeenCalled();
    // Back to zero → registering again is a first publisher, no warning.
    store.getState().registerPublisher("a");
    expect(warn).not.toHaveBeenCalled();
    // A genuine second concurrent publisher still warns.
    store.getState().registerPublisher("a");
    expect(warn).toHaveBeenCalledOnce();
  });
});
