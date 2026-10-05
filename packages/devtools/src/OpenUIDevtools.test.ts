// @vitest-environment jsdom
import { observability, toErrorInfo } from "@openuidev/observability";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenUIDevtoolsWidget, type OpenUIDevtoolsWidgetProps } from "./OpenUIDevtoolsWidget";

vi.mock("@openuidev/react-lang", async () => {
  const { createElement: el } = await import("react");
  const parse = (src: string) => ({
    root: /\broot\s*=/.test(src)
      ? { type: "element" as const, typeName: "Card", props: {}, partial: false }
      : null,
    meta: {
      incomplete: false,
      unresolved: [] as string[],
      orphaned: [] as string[],
      statementCount: src.trim() ? 1 : 0,
      errors: [] as unknown[],
    },
  });
  return {
    Renderer: (props: { response: string | null }) =>
      el("div", { "data-testid": "openui-renderer" }, props.response ?? ""),
    createParser: () => ({ parse }),
    createStreamingParser: () => {
      let buf = "";
      return {
        push: (chunk: string) => {
          buf += chunk;
          return parse(buf);
        },
        getResult: () => parse(buf),
      };
    },
  };
});

const LIBRARIES_KEY = Symbol.for("openui.devtools.libraries");

function seedLibrary(): void {
  (
    globalThis as {
      [LIBRARIES_KEY]?: Record<
        string,
        {
          root: string;
          components: Record<string, unknown>;
          toJSONSchema: () => unknown;
        }
      >;
    }
  )[LIBRARIES_KEY] = {
    Card: {
      root: "Card",
      components: { Card: {} },
      toJSONSchema: () => ({ $defs: { Card: { type: "object", properties: {} } } }),
    },
  };
}

function clearLibraries(): void {
  delete (globalThis as { [LIBRARIES_KEY]?: unknown })[LIBRARIES_KEY];
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  window.localStorage.clear();
  clearLibraries();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(props: OpenUIDevtoolsWidgetProps): void {
  act(() => root.render(createElement(OpenUIDevtoolsWidget, props)));
}

/** The floating toggle button. */
function toggle(): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Open OpenUI Inspect"]',
  );
  if (!button) throw new Error("toggle button not found");
  return button;
}

function click(el: Element): void {
  act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

function buttonByText(text: string): HTMLButtonElement | undefined {
  return [...container.querySelectorAll("button")].find((b) => b.textContent === text) as
    HTMLButtonElement | undefined;
}

/** Emits a settled stream event and expands its row, exposing the Debug button. */
function seedStream(response: string): void {
  act(() =>
    observability.info({
      kind: "react-lang:stream",
      id: "stream-debug-entry",
      phase: "settled",
      response,
      parser: { statementCount: response.trim() ? 1 : 0, orphaned: [] },
      errors: [],
    }),
  );
  const row = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Toggle OpenUI Lang stream details"]',
  );
  if (!row) throw new Error("stream row not found");
  click(row);
}

function streamDebugButton(): HTMLButtonElement | undefined {
  return container.querySelector<HTMLButtonElement>('button[aria-label="Debug"]') ?? undefined;
}

/**
 * Debug has no banner of its own — a stream event's Debug button is the way in.
 * The default response is blank so the editor opens effectively empty (the
 * button is disabled on a truly empty response).
 */
function openDebugTray(response = " "): void {
  seedStream(response);
  const debug = streamDebugButton();
  if (!debug) throw new Error("stream Debug button not found");
  click(debug);
}

/**
 * The stream row's overview stats, each read back as "2 statements" — the count
 * lives in its own badge, so textContent alone would say "2statements".
 */
function overviewStats(): string[] {
  const row = container.querySelector<HTMLElement>(
    'button[aria-label="Toggle OpenUI Lang stream details"] > div:last-child',
  );
  return [...(row?.children ?? [])].map((stat) => {
    const count = stat.firstElementChild?.textContent ?? "";
    return `${count} ${(stat.textContent ?? "").slice(count.length)}`;
  });
}

/**
 * Both trays stay mounted so they can transition; a retracted one carries
 * `inert`. "Showing" therefore means present and not inert.
 */
function trayShown(label: "OpenUI Inspect" | "OpenUI Debug"): boolean {
  const tray = container.querySelector<HTMLElement>(`aside[aria-label="${label}"]`);
  return !!tray && !tray.hasAttribute("inert");
}

/** The display filters live behind the header settings button. */
function openSettings(): void {
  const button = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Devtools settings"]',
  );
  if (!button) throw new Error("settings button not found");
  click(button);
}

function checkboxLabeled(text: string): HTMLInputElement {
  const label = [...container.querySelectorAll("label")].find((el) =>
    el.textContent?.includes(text),
  );
  const input = label?.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (!input) throw new Error(`checkbox "${text}" not found`);
  return input;
}

function remount(props: OpenUIDevtoolsWidgetProps): void {
  act(() => root.unmount());
  root = createRoot(container);
  render(props);
}

describe("OpenUIDevtools", () => {
  it("renders nothing when disabled", () => {
    render({ enabled: false });
    expect(container.childElementCount).toBe(0);
  });

  it("renders the toggle and opens the drawer on click", () => {
    render({ enabled: true });
    expect(toggle().getAttribute("aria-expanded")).toBe("false");

    click(toggle());
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
  });

  it("lists an emitted error event and shows the error-count badge", () => {
    render({ enabled: true, errorsOnly: false });
    act(() => observability.error({ kind: "boom", error: toErrorInfo(new Error("kaboom")) }));

    expect(container.textContent).toContain("boom");
    // Badge count of error-severity events.
    expect(toggle().textContent).toContain("1");
  });

  it("auto-opens the drawer on an error when autoOpenOnError is true", () => {
    render({ enabled: true, autoOpenOnError: true });
    expect(toggle().getAttribute("aria-expanded")).toBe("false");

    act(() => observability.error({ kind: "boom" }));
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
  });

  it("does not auto-open when autoOpenOnError is false", () => {
    render({ enabled: true, autoOpenOnError: false });
    act(() => observability.error({ kind: "boom" }));
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });

  it("auto-opens the drawer when a stream settles with errors", () => {
    render({ enabled: true, autoOpenOnError: true, errorsOnly: false });
    expect(toggle().getAttribute("aria-expanded")).toBe("false");

    act(() =>
      observability.info({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "streaming",
        runId: "run-1",
      }),
    );
    expect(toggle().getAttribute("aria-expanded")).toBe("false");

    act(() =>
      observability.error({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "settled",
        runId: "run-1",
        errors: [
          { source: "parser", code: "unknown-component", message: "Unknown component Ghost" },
        ],
      }),
    );
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
  });

  it("opens a collapsed run group when an error arrives later", () => {
    render({ enabled: true, autoOpenOnError: false, errorsOnly: false });

    act(() => {
      observability.info({
        kind: "LLM:request",
        runId: "run-old",
        userMessage: { role: "user", content: "older prompt" },
      });
      observability.info({ kind: "LLM:response", runId: "run-old", status: 200 });
      observability.info({
        kind: "LLM:request",
        runId: "run-new",
        userMessage: { role: "user", content: "newer prompt" },
      });
      observability.info({ kind: "LLM:response", runId: "run-new", status: 200 });
    });

    const older = container.querySelector<HTMLElement>('[role="group"][aria-label="older prompt"]');
    expect(older?.querySelector("button")?.getAttribute("aria-expanded")).toBe("false");

    act(() =>
      observability.error({
        kind: "react-lang:stream",
        id: "stream-old",
        phase: "settled",
        runId: "run-old",
        errors: [{ message: "late parse error" }],
      }),
    );

    expect(older?.querySelector("button")?.getAttribute("aria-expanded")).toBe("true");
    expect(older?.querySelector('[aria-label="error"]')).not.toBeNull();
    expect(container.textContent).toContain("late parse error");
  });

  it("restores auto-open on error from a previous session", () => {
    render({ enabled: true, autoOpenOnError: true });
    openSettings();
    expect(checkboxLabeled("Auto-open on error").checked).toBe(true);

    act(() => checkboxLabeled("Auto-open on error").click());
    expect(checkboxLabeled("Auto-open on error").checked).toBe(false);

    remount({ enabled: true, autoOpenOnError: true });
    openSettings();
    expect(checkboxLabeled("Auto-open on error").checked).toBe(false);

    act(() => observability.error({ kind: "boom" }));
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });

  it("restores the errors-only filter from a previous session", () => {
    render({ enabled: true, errorsOnly: false });
    openSettings();
    act(() => checkboxLabeled("Show errors only").click());
    expect(checkboxLabeled("Show errors only").checked).toBe(true);

    remount({ enabled: true, errorsOnly: false });
    openSettings();
    expect(checkboxLabeled("Show errors only").checked).toBe(true);

    act(() => observability.info({ kind: "just-info" }));
    act(() => observability.error({ kind: "real-error" }));
    expect(container.textContent).not.toContain("just-info");
    expect(container.textContent).toContain("real-error");
  });

  it("filters out info events when errorsOnly is set", () => {
    render({ enabled: true, errorsOnly: true });
    act(() => observability.info({ kind: "just-info" }));
    act(() => observability.warn({ kind: "useful-warning" }));
    act(() => observability.error({ kind: "real-error" }));

    expect(container.textContent).not.toContain("just-info");
    expect(container.textContent).toContain("useful-warning");
    expect(container.textContent).toContain("real-error");
  });

  it("coalesces successive snapshots of any event with a stable id", () => {
    render({ enabled: true, errorsOnly: false });

    act(() =>
      observability.info({
        id: "job-1",
        kind: "job:progress",
        message: "Starting",
      }),
    );
    act(() =>
      observability.warn({
        id: "job-1",
        kind: "job:progress",
        message: "Needs attention",
      }),
    );

    expect(container.textContent?.match(/job:progress/g)).toHaveLength(1);
    expect(container.textContent).not.toContain("Starting");
    expect(container.textContent).toContain("Needs attention");
  });

  it("expands the stack trace on the error card", () => {
    render({ enabled: true, errorsOnly: false });
    const err = new Error("kaboom");
    err.stack = "Error: kaboom\n    at boom (app.ts:1:1)";
    act(() => observability.error({ kind: "boom", error: toErrorInfo(err) }));

    expect(container.textContent).toContain("kaboom");
    expect(container.textContent).not.toContain("at boom (app.ts:1:1)");

    const expand = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Toggle stack trace"]',
    );
    expect(expand).not.toBeNull();
    click(expand!);

    expect(container.textContent).toContain("at boom (app.ts:1:1)");
    expect(buttonByText("Copy")).toBeDefined();
  });

  it("coalesces react-lang stream updates by their stable event id", () => {
    render({ enabled: true, errorsOnly: false });

    act(() =>
      observability.info({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "streaming",
        updateIndex: 1,
        response: "root = Car",
        parser: { statementCount: 1, orphaned: [] },
      }),
    );
    act(() =>
      observability.info({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "streaming",
        updateIndex: 2,
        response: 'root = Card("done")',
        parser: { statementCount: 2, orphaned: ["unused"] },
      }),
    );

    expect(container.textContent?.match(/OpenUI Lang stream/g)).toHaveLength(1);
    expect(container.querySelector('[aria-label="info"]')).not.toBeNull();
    expect(container.textContent).toContain("Streaming");
    expect(overviewStats()).toContain("2 statements");
    expect(overviewStats()).toContain("1 orphaned statement");
    expect(container.textContent).not.toContain("stream-1");
    expect(container.textContent).not.toContain('root = Card("done")');

    const expand = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Toggle OpenUI Lang stream details"]',
    );
    expect(expand).not.toBeNull();
    click(expand!);

    expect(container.textContent).toContain('root = Card("done")');
    expect(container.textContent).toContain("Orphaned: unused");
  });

  it("replaces a stream update with its settled diagnostics", () => {
    render({ enabled: true, errorsOnly: false });

    act(() =>
      observability.info({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "streaming",
        updateIndex: 1,
        response: "root = Ghost()",
      }),
    );
    act(() =>
      observability.error({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "settled",
        updateIndex: 1,
        response: "root = Ghost()",
        parser: { statementCount: 1, orphaned: [] },
        errors: [
          {
            source: "parser",
            code: "unknown-component",
            message: "Unknown component Ghost",
            component: "Ghost",
            statementId: "root",
            hint: "Use a component registered in the library",
          },
        ],
      }),
    );

    expect(container.textContent?.match(/OpenUI Lang stream/g)).toHaveLength(1);
    expect(container.textContent).not.toContain("settled");
    expect(container.textContent).not.toContain("Streaming");
    expect(overviewStats()).toContain("1 statement");
    expect(overviewStats()).toContain("1 error");
    expect(toggle().getAttribute("aria-expanded")).toBe("true");

    const expand = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Toggle OpenUI Lang stream details"]',
    );
    expect(expand?.getAttribute("aria-expanded")).toBe("true");
    expect(container.textContent).toContain("parser / unknown-component");
    expect(container.textContent).toContain("Unknown component Ghost");
    expect(container.textContent).toContain("Use a component registered in the library");
    expect(container.textContent).toContain("root = Ghost()");
    expect(toggle().textContent).toContain("1");
  });

  it("debugs a stream response in OpenUI Debug", () => {
    seedLibrary();
    render({ enabled: true, errorsOnly: false });
    act(() =>
      observability.info({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "settled",
        response: 'root = Card("from stream")',
        parser: { statementCount: 1, orphaned: [] },
        errors: [],
      }),
    );

    click(
      container.querySelector<HTMLButtonElement>(
        'button[aria-label="Toggle OpenUI Lang stream details"]',
      )!,
    );
    click(container.querySelector('button[aria-label="Debug"]')!);

    const editor = container.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="OpenUI Lang"]',
    );
    expect(trayShown("OpenUI Debug")).toBe(true);
    expect(editor?.value).toBe('root = Card("from stream")');
  });

  it("hides provisional errors while the stream is still running", () => {
    render({ enabled: true, errorsOnly: false });

    act(() =>
      observability.info({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "streaming",
        response: "root = Ghost()",
        errors: [{ source: "parser", code: "unknown-component", message: "Transient error" }],
        parser: { statementCount: 1, orphaned: ["draft"] },
      }),
    );

    const expand = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Toggle OpenUI Lang stream details"]',
    );
    click(expand!);

    expect(container.textContent).not.toContain("Transient error");
    expect(container.textContent).toContain("root = Ghost()");
    expect(container.textContent).toContain("Orphaned: draft");
  });

  it("keeps an expanded stream open when a settled error snapshot is refreshed", () => {
    render({ enabled: true, errorsOnly: false });

    act(() =>
      observability.error({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "settled",
        response: "root = First()",
        errors: [{ source: "parser", code: "first-error", message: "First error" }],
      }),
    );

    const expand = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Toggle OpenUI Lang stream details"]',
    );
    expect(expand?.getAttribute("aria-expanded")).toBe("true");
    expect(container.textContent).toContain("First error");

    act(() =>
      observability.error({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "settled",
        response: "root = Second()",
        errors: [{ source: "query", code: "query-error", message: "Second error" }],
      }),
    );

    expect(container.textContent?.match(/OpenUI Lang stream/g)).toHaveLength(1);
    expect(container.textContent).not.toContain("First error");
    expect(container.textContent).toContain("Second error");
    expect(container.textContent).toContain("root = Second()");
  });

  it("renders only one widget when multiple instances are mounted", () => {
    const second = document.createElement("div");
    document.body.appendChild(second);
    const secondRoot = createRoot(second);

    render({ enabled: true });
    act(() => secondRoot.render(createElement(OpenUIDevtoolsWidget, { enabled: true })));

    expect(document.querySelectorAll('button[aria-label="Open OpenUI Inspect"]')).toHaveLength(1);

    act(() => secondRoot.unmount());
    second.remove();
  });

  it("lets a manual instance win over an auto-mounted one", () => {
    // Auto-mounted instance first (as react-lang's bootstrap would do) …
    render({ enabled: true, __autoMounted: true });
    expect(container.querySelector('button[aria-label="Open OpenUI Inspect"]')).not.toBeNull();

    // … then a manual instance mounts and takes over.
    const manual = document.createElement("div");
    document.body.appendChild(manual);
    const manualRoot = createRoot(manual);
    act(() => manualRoot.render(createElement(OpenUIDevtoolsWidget, { enabled: true })));

    expect(container.querySelector('button[aria-label="Open OpenUI Inspect"]')).toBeNull();
    expect(manual.querySelector('button[aria-label="Open OpenUI Inspect"]')).not.toBeNull();

    // When the manual instance unmounts, the auto instance takes back over.
    act(() => manualRoot.unmount());
    manual.remove();
    expect(container.querySelector('button[aria-label="Open OpenUI Inspect"]')).not.toBeNull();
  });

  it("removes a resolved stream from the errors-only view", () => {
    render({ enabled: true, errorsOnly: true, autoOpenOnError: false });

    act(() =>
      observability.error({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "settled",
        errors: [{ source: "query", code: "query-error", message: "Query failed" }],
      }),
    );
    expect(container.textContent).toContain("OpenUI Lang stream");

    act(() =>
      observability.info({
        kind: "react-lang:stream",
        id: "stream-1",
        phase: "settled",
        errors: [],
      }),
    );

    expect(container.textContent).not.toContain("OpenUI Lang stream");
    expect(container.textContent).toContain("No events captured yet.");
  });

  it("disables OpenUI Debug until a library is registered", () => {
    render({ enabled: true });
    seedStream('root = Card("x")');
    expect(streamDebugButton()?.disabled).toBe(true);
  });

  it("opens OpenUI Debug from a late-mounted registry entry", () => {
    seedLibrary();
    render({ enabled: true });
    seedStream('root = Card("x")');
    const debug = streamDebugButton();
    expect(debug?.disabled).toBe(false);
    click(debug!);
    expect(trayShown("OpenUI Debug")).toBe(true);
    expect(container.querySelector('textarea[aria-label="OpenUI Lang"]')).not.toBeNull();
  });

  it("shows Debug panels and stream controls", () => {
    seedLibrary();
    render({ enabled: true });
    openDebugTray();
    expect(container.querySelector('[aria-label="Playback controls"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Stream"]')).not.toBeNull();
    const tabs = container.querySelector('[role="tablist"]')?.textContent ?? "";
    expect(tabs).toContain("Render");
    expect(tabs).toContain("Validation");
    expect(tabs).toContain("Tree");
    expect(tabs).toContain("JSON");
    expect(tabs).toContain("Stream");
  });

  it("switches to the validation panel", async () => {
    seedLibrary();
    render({ enabled: true });
    openDebugTray();
    await act(async () => {
      await Promise.resolve();
    });
    const validation = [...container.querySelectorAll('[role="tab"]')].find((tab) =>
      tab.textContent?.startsWith("Validation"),
    );
    click(validation!);
    expect(container.textContent).toContain("Add some OpenUI Lang to validate it.");
  });

  it("does not list library registration pings as events", () => {
    render({ enabled: true, errorsOnly: false });
    act(() =>
      observability.info({
        kind: "react-lang:library",
        root: "Card",
        components: ["Card"],
        message: "Library registered (root: Card)",
      }),
    );
    click(toggle());
    expect(container.textContent).not.toContain("Library registered");
    expect(container.textContent).toContain("No events captured yet.");
  });

  it("opens OpenUI Debug on its own tray beside Inspect", () => {
    seedLibrary();
    render({ enabled: true });
    click(toggle());
    openDebugTray();

    expect(trayShown("OpenUI Inspect")).toBe(true);
    expect(trayShown("OpenUI Debug")).toBe(true);
  });

  it("closes only the Debug tray, leaving Inspect open", () => {
    seedLibrary();
    render({ enabled: true });
    click(toggle());
    openDebugTray();

    click(container.querySelector('button[aria-label="Close OpenUI Debug"]')!);

    expect(trayShown("OpenUI Debug")).toBe(false);
    expect(trayShown("OpenUI Inspect")).toBe(true);
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
  });

  it("closes only the Inspect tray, leaving Debug open", () => {
    seedLibrary();
    render({ enabled: true });
    click(toggle());
    openDebugTray();

    click(container.querySelector('button[aria-label="Close OpenUI Inspect"]')!);

    expect(trayShown("OpenUI Inspect")).toBe(false);
    expect(trayShown("OpenUI Debug")).toBe(true);
  });

  it("ejects OpenUI Debug into a separate window", () => {
    seedLibrary();
    const popupDoc = document.implementation.createHTMLDocument("debug");
    const popup = {
      document: popupDoc,
      focus: vi.fn(),
      close: vi.fn(),
      closed: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const open = vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);

    render({ enabled: true });
    openDebugTray();
    click(container.querySelector('button[aria-label="Open OpenUI Debug in a new window"]')!);

    expect(open).toHaveBeenCalled();
    expect(trayShown("OpenUI Debug")).toBe(false);
    expect(popupDoc.getElementById("openui-debug-root")).not.toBeNull();
    expect(popupDoc.body.textContent).toContain("OpenUI Debug");
    open.mockRestore();
  });

  it("focuses the ejected window when OpenUI Debug is clicked again", () => {
    seedLibrary();
    const popupDoc = document.implementation.createHTMLDocument("debug");
    const popup = {
      document: popupDoc,
      focus: vi.fn(),
      close: vi.fn(),
      closed: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const open = vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);

    render({ enabled: true });
    openDebugTray();
    click(container.querySelector('button[aria-label="Open OpenUI Debug in a new window"]')!);
    popup.focus.mockClear();

    // Same entry point again, with the row still expanded from the first open.
    click(streamDebugButton()!);

    expect(popup.focus).toHaveBeenCalled();
    expect(trayShown("OpenUI Debug")).toBe(false);
    open.mockRestore();
  });

  it("returns an ejected window to the tray", () => {
    seedLibrary();
    const popupDoc = document.implementation.createHTMLDocument("debug");
    const popup = {
      document: popupDoc,
      focus: vi.fn(),
      close: vi.fn(),
      closed: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const open = vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);

    render({ enabled: true });
    openDebugTray();
    click(container.querySelector('button[aria-label="Open OpenUI Debug in a new window"]')!);
    expect(trayShown("OpenUI Debug")).toBe(false);

    click(popupDoc.querySelector('button[aria-label="Return OpenUI Debug to the tray"]')!);

    expect(popup.close).toHaveBeenCalled();
    expect(trayShown("OpenUI Debug")).toBe(true);
    open.mockRestore();
  });

  it("stays in the drawer when the popup is blocked", () => {
    seedLibrary();
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    render({ enabled: true });
    openDebugTray();
    click(container.querySelector('button[aria-label="Open OpenUI Debug in a new window"]')!);

    expect(trayShown("OpenUI Debug")).toBe(true);
    expect(container.textContent).toContain("Allow popups for this origin");
    open.mockRestore();
  });
});
