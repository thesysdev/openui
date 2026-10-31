// @vitest-environment jsdom
import type { OpenUIError, ParseResult, QuerySnapshot } from "@openuidev/lang-core";
import { observability, type ObservabilityEvent } from "@openuidev/observability";
import { act, createElement, StrictMode, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Library } from "../library";
import { useOpenUIErrors } from "./useOpenUIErrors";
import { useStreamingObservability } from "./useStreamingObservability";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const response = 'root = Root("done")';
const result = {
  root: {
    type: "element",
    typeName: "Root",
    props: {},
    partial: false,
  },
  meta: {
    incomplete: false,
    unresolved: [],
    orphaned: [],
    statementCount: 1,
    errors: [],
    discarded: [],
  },
  stateDeclarations: {},
  queryStatements: [],
  mutationStatements: [],
} satisfies ParseResult;

const library = {
  root: "Root",
  components: { Root: {} },
} as unknown as Library;

function Harness({
  isStreaming,
  queryErrors,
  currentResponse = response,
  publish,
}: {
  isStreaming: boolean;
  queryErrors: OpenUIError[];
  currentResponse?: string;
  publish?: boolean;
}) {
  const parseExceptionRef = useRef<OpenUIError | null>(null);
  const runtimeErrorsRef = useRef<OpenUIError[]>([]);
  const renderErrorsRef = useRef<OpenUIError[]>([]);
  const querySnapshot = {
    __openui_loading: [],
    __openui_refetching: [],
    __openui_errors: queryErrors,
  } satisfies QuerySnapshot;

  const { errorsRef, errorRevision } = useOpenUIErrors({
    response: currentResponse,
    isStreaming,
    result,
    evaluatedResult: result,
    library,
    querySnapshot,
    parseExceptionRef,
    runtimeErrorsRef,
    renderErrorsRef,
  });

  useStreamingObservability({
    response: currentResponse,
    isStreaming,
    result,
    errorsRef,
    errorRevision,
    publish,
  });
  return null;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("streaming observability integration", () => {
  it("uses a new id when the mounted Renderer starts another stream", () => {
    const events: ObservabilityEvent[] = [];
    const removeListener = observability.listenAll((event) => {
      if (event.detail.kind === "react-lang:stream") events.push(event);
    });

    act(() =>
      root.render(
        createElement(Harness, {
          isStreaming: true,
          queryErrors: [],
          currentResponse: "first",
        }),
      ),
    );
    act(() =>
      root.render(
        createElement(Harness, {
          isStreaming: false,
          queryErrors: [],
          currentResponse: "first",
        }),
      ),
    );
    act(() =>
      root.render(
        createElement(Harness, {
          isStreaming: true,
          queryErrors: [],
          currentResponse: "second",
        }),
      ),
    );
    act(() =>
      root.render(
        createElement(Harness, {
          isStreaming: false,
          queryErrors: [],
          currentResponse: "second",
        }),
      ),
    );
    removeListener();

    const streamIds = events.map((event) => event.detail.id);
    expect(events.map((event) => event.detail["phase"])).toEqual([
      "streaming",
      "settled",
      "streaming",
      "settled",
    ]);
    expect(streamIds[0]).toBe(streamIds[1]);
    expect(streamIds[2]).toBe(streamIds[3]);
    expect(streamIds[2]).not.toBe(streamIds[0]);
  });

  it("stays off the bus when publishing is disabled", () => {
    const events: ObservabilityEvent[] = [];
    const removeListener = observability.listenAll((event) => {
      if (event.detail.kind === "react-lang:stream") events.push(event);
    });

    act(() =>
      root.render(createElement(Harness, { isStreaming: true, queryErrors: [], publish: false })),
    );
    act(() =>
      root.render(createElement(Harness, { isStreaming: false, queryErrors: [], publish: false })),
    );
    removeListener();

    expect(events).toEqual([]);
  });

  it("republishes settled with the same id when a query error arrives later", () => {
    const events: ObservabilityEvent[] = [];
    const removeListener = observability.listenAll((event) => {
      if (event.detail.kind === "react-lang:stream") events.push(event);
    });

    act(() => root.render(createElement(Harness, { isStreaming: true, queryErrors: [] })));
    act(() => root.render(createElement(Harness, { isStreaming: false, queryErrors: [] })));

    const queryError: OpenUIError = {
      source: "query",
      code: "tool-error",
      message: "Query failed",
    };
    act(() =>
      root.render(createElement(Harness, { isStreaming: false, queryErrors: [queryError] })),
    );
    removeListener();

    const settled = events.filter((event) => event.detail["phase"] === "settled");
    expect(settled).toHaveLength(2);
    expect(settled[0]?.detail.id).toBe(settled[1]?.detail.id);
    expect(settled[0]?.detail["errors"]).toEqual([]);
    expect(settled[1]?.level).toBe("error");
    expect(settled[1]?.detail["errors"]).toEqual([queryError]);
    expect(settled[1]?.detail["response"]).toBe(response);
  });

  it("publishes unmounted when the Renderer unmounts mid-stream", () => {
    const events: ObservabilityEvent[] = [];
    const removeListener = observability.listenAll((event) => {
      if (event.detail.kind === "react-lang:stream") events.push(event);
    });

    act(() =>
      root.render(
        createElement(Harness, { isStreaming: true, queryErrors: [], currentResponse: "root = " }),
      ),
    );
    act(() => root.render(null));
    removeListener();

    expect(events.map((event) => event.detail["phase"])).toEqual(["streaming", "unmounted"]);
    expect(events[1]?.level).toBe("warning");
    expect(events[1]?.detail.id).toBe(events[0]?.detail.id);
    expect(events[1]?.detail["response"]).toBe("root = ");
    expect(events[1]?.detail["message"]).toBe("Stream interrupted");
  });

  it("does not publish unmounted after the stream settled", () => {
    const events: ObservabilityEvent[] = [];
    const removeListener = observability.listenAll((event) => {
      if (event.detail.kind === "react-lang:stream") events.push(event);
    });

    act(() => root.render(createElement(Harness, { isStreaming: true, queryErrors: [] })));
    act(() => root.render(createElement(Harness, { isStreaming: false, queryErrors: [] })));
    act(() => root.render(null));
    removeListener();

    expect(events.map((event) => event.detail["phase"])).toEqual(["streaming", "settled"]);
  });

  it("resumes streaming after a StrictMode effect replay", () => {
    const events: ObservabilityEvent[] = [];
    const removeListener = observability.listenAll((event) => {
      if (event.detail.kind === "react-lang:stream") events.push(event);
    });

    act(() =>
      root.render(
        createElement(
          StrictMode,
          null,
          createElement(Harness, { isStreaming: true, queryErrors: [] }),
        ),
      ),
    );
    removeListener();

    expect(events.at(-1)?.detail["phase"]).toBe("streaming");
    expect(new Set(events.map((event) => event.detail.id)).size).toBe(1);
  });
});
