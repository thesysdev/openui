import { describe, expect, it, vi } from "vitest";
import { createStore } from "../store";

describe("createStore", () => {
  it("initializes with defaults and persisted values", () => {
    const store = createStore();
    store.initialize({ $title: "Hello", $count: 0 }, { $theme: "dark" });

    expect(store.get("$title")).toBe("Hello");
    expect(store.get("$count")).toBe(0);
    expect(store.get("$theme")).toBe("dark");
  });

  it("prioritizes persisted values over defaults", () => {
    const store = createStore();
    store.initialize({ $title: "Default" }, { $title: "Persisted" });

    expect(store.get("$title")).toBe("Persisted");
  });

  it("updates pristine declaration defaults as streaming input completes", () => {
    const store = createStore();

    // Stream step 1: truncated default arrives
    store.initialize({ $title: "issue" }, {});
    expect(store.get("$title")).toBe("issue");

    // Stream step 2: full default arrives, key is pristine (user hasn't touched it)
    store.initialize({ $title: "issue with OpenUI, missing Vue 3 headless package" }, {});
    expect(store.get("$title")).toBe("issue with OpenUI, missing Vue 3 headless package");
  });

  it("does not overwrite user-modified values when defaults update", () => {
    const store = createStore();

    // Initial default arrives
    store.initialize({ $title: "initial" }, {});
    expect(store.get("$title")).toBe("initial");

    // User edits the field
    store.set("$title", "user edited title");
    expect(store.get("$title")).toBe("user edited title");

    // Stream re-initializes or updates declaration
    store.initialize({ $title: "stream updated title" }, {});
    expect(store.get("$title")).toBe("user edited title");
  });

  it("does not overwrite persisted values when defaults update", () => {
    const store = createStore();

    // Initialized with persisted value
    store.initialize({ $title: "default 1" }, { $title: "persisted title" });
    expect(store.get("$title")).toBe("persisted title");

    // Stream updates declaration default
    store.initialize({ $title: "default 2" }, {});
    expect(store.get("$title")).toBe("persisted title");
  });

  it("preserves pristine status if set is called with the identical value", () => {
    const store = createStore();

    store.initialize({ $title: "foo" }, {});
    // Setting to identical value is a no-op
    store.set("$title", "foo");

    // Default updates
    store.initialize({ $title: "foobar" }, {});
    expect(store.get("$title")).toBe("foobar");
  });

  it("notifies subscribers when pristine default updates", () => {
    const store = createStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.initialize({ $title: "partial" }, {});
    expect(listener).toHaveBeenCalledTimes(1);

    store.initialize({ $title: "full" }, {});
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot()).toEqual({ $title: "full" });
  });

  it("does not notify subscribers if initialize makes no changes", () => {
    const store = createStore();
    store.initialize({ $title: "same" }, {});

    const listener = vi.fn();
    store.subscribe(listener);

    // Call initialize again with same values
    store.initialize({ $title: "same" }, {});
    expect(listener).not.toHaveBeenCalled();
  });

  it("clears state and pristine tracking on dispose", () => {
    const store = createStore();
    store.initialize({ $title: "test" }, {});
    store.set("$title", "modified");

    store.dispose();
    expect(store.getSnapshot()).toEqual({});
    expect(store.get("$title")).toBeUndefined();

    // Re-initialize after dispose
    store.initialize({ $title: "new" }, {});
    expect(store.get("$title")).toBe("new");
    // Should be pristine again
    store.initialize({ $title: "new updated" }, {});
    expect(store.get("$title")).toBe("new updated");
  });
});
