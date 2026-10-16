// @vitest-environment jsdom
import { action, type OpenUIError } from "@openuidev/lang-core";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { useTriggerAction } from "./context";
import { createLibrary, defineComponent, defineFunction } from "./index";
import { Renderer } from "./Renderer";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Text = defineComponent({
  name: "Text",
  props: z.object({ value: z.string() }),
  description: "Shows a value",
  component: ({ props }) => createElement("span", null, props.value),
});
const percent = defineFunction({
  name: "Percent",
  description: "Formats part / total as a percentage",
  params: z.object({ part: z.number(), total: z.number() }),
  returns: z.string(),
  fn: ({ part, total }) => `${((part / total) * 100).toFixed(1)}%`,
});
const library = createLibrary({ root: "Text", components: [Text], functions: [percent] });

it("Renderer evaluates library function calls", async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  const response = "root = Text(@Percent(763, 1000))";
  await act(async () => root.render(createElement(Renderer, { library, response })));
  expect(container.textContent).toBe("76.3%");
  await act(async () => root.unmount());
});

const Button = defineComponent({
  name: "Button",
  description: "Run a deferred expression",
  props: z.object({ action: action() }),
  component: ({ props }) => {
    const trigger = useTriggerAction();
    return <button onClick={() => void trigger("Run", undefined, props.action)}>Run</button>;
  },
});

it.each(["Query", "Mutation", "Set"])(
  "reports and clears deferred function errors in %s",
  async (kind) => {
    const fn = vi.fn<(args: { value: string }) => string>();
    const checked = defineFunction({
      name: "Checked",
      description: "Function with a validated return",
      params: z.object({ value: z.string() }),
      returns: z.string(),
      fn,
    });
    const lib = createLibrary({ root: "Button", components: [Button], functions: [checked] });
    const response =
      kind === "Query"
        ? 'root = Button(@Set($arg, $arg + "x"))\n$arg = "test"\nq = Query("save", {value: @Checked($arg)})'
        : kind === "Set"
          ? 'root = Button(@Set($x, @Checked("test")))\n$x = null'
          : `root = Button(@Run(q))\nq = ${kind}("save", {value: @Checked("test")})`;
    const container = document.createElement("div");
    const root = createRoot(container);
    let errors: OpenUIError[] = [];
    const onError = vi.fn((next: OpenUIError[]) => {
      errors = next;
    });
    const save = vi.fn(async () => ({ saved: true }));
    const render = async (program = response, isStreaming = false) => {
      await act(async () =>
        root.render(
          <Renderer
            library={lib}
            response={program}
            isStreaming={isStreaming}
            toolProvider={{ save }}
            onError={onError}
            publishObservability={false}
          />,
        ),
      );
    };
    const run = async () => {
      await act(async () => container.querySelector("button")!.click());
    };
    try {
      fn.mockImplementation(() => {
        throw new Error("deliberate failure");
      });
      await render(response, true);
      expect(errors).toEqual([]);
      expect(save).not.toHaveBeenCalled();
      await render();
      if (kind !== "Query") {
        expect(errors).toEqual([]);
        await run();
      }
      expect(errors).toEqual([
        expect.objectContaining({
          source: "runtime",
          code: "runtime-error",
          message: expect.stringContaining("@Checked threw: deliberate failure"),
        }),
      ]);
      if (kind !== "Set") expect(save).toHaveBeenCalledWith({ value: null });
      const reports = onError.mock.calls.length;
      await run();
      expect(onError).toHaveBeenCalledTimes(reports);
      // @ts-expect-error Exercise a JavaScript implementation violating its return schema.
      fn.mockReturnValue(42);
      await run();
      expect(errors).toEqual([
        expect.objectContaining({
          code: "runtime-error",
          message: expect.stringContaining("expects string but got number"),
        }),
      ]);
      fn.mockReturnValue("recovered");
      await run();
      expect(errors).toEqual([]);
      fn.mockImplementation(() => {
        throw new Error("deliberate failure");
      });
      await run();
      expect(errors).toHaveLength(1);
      await render('root = Button(@Set($x, "ok"))');
      expect(errors).toEqual([]);
    } finally {
      await act(async () => root.unmount());
    }
  },
);

it("keeps Query errors when a Set evaluation recovers", async () => {
  let failSet = true;
  const checked = defineFunction({
    name: "Checked",
    description: "Throws by operation",
    params: z.object({ value: z.string() }),
    fn: ({ value }) => {
      if (value === "query" || failSet) throw new Error(value);
      return value;
    },
  });
  const lib = createLibrary({ root: "Button", components: [Button], functions: [checked] });
  const container = document.createElement("div");
  const root = createRoot(container);
  let errors: OpenUIError[] = [];
  try {
    await act(async () =>
      root.render(
        <Renderer
          library={lib}
          isStreaming={false}
          publishObservability={false}
          response={
            'root = Button(@Set($x, @Checked("set")))\n$x = null\nq = Query("save", {value: @Checked("query")})'
          }
          toolProvider={{ save: async () => ({}) }}
          onError={(next) => {
            errors = next;
          }}
        />,
      ),
    );
    expect(errors).toHaveLength(1);
    await act(async () => container.querySelector("button")!.click());
    expect(errors).toHaveLength(2);
    failSet = false;
    await act(async () => container.querySelector("button")!.click());
    expect(errors).toEqual([expect.objectContaining({ statementId: "q", code: "runtime-error" })]);
  } finally {
    await act(async () => root.unmount());
  }
});
