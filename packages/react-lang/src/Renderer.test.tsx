// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { FormNameContext } from "./context";
import { useStateField } from "./hooks/useStateField";
import { createLibrary, defineComponent } from "./library";
import { Renderer } from "./Renderer";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Field = defineComponent({
  name: "Field",
  description: "Field",
  props: z.object({ name: z.string() }),
  component: ({ props }) => {
    const field = useStateField<string>(props.name);
    return <button onClick={() => field.setValue("typed")}>{field.value ?? ""}</button>;
  },
});

const Form = defineComponent({
  name: "Form",
  description: "Form",
  props: z.object({ name: z.string(), fields: z.array(Field.ref) }),
  component: ({ props, renderNode }) => (
    <FormNameContext.Provider value={props.name}>
      {renderNode(props.fields)}
    </FormNameContext.Provider>
  ),
});

const library = createLibrary({ components: [Form, Field], root: "Form" });

it("shows field input in a program without dynamic props", async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () =>
    root.render(
      <Renderer library={library} response={'root = Form("c", [e])\ne = Field("email")'} />,
    ),
  );
  const button = container.querySelector("button")!;
  await act(async () => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(button.textContent).toBe("typed");
  await act(async () => root.unmount());
});

// Regression tests for #727: ElementErrorBoundary must not re-present stale
// children after a render error — re-inserting elements React has already
// reconciled can crash the host app with a commit-phase NotFoundError.

/** Throws when fed "boom", like a component receiving partially-streamed props. */
const MaybeThrow = defineComponent({
  name: "MaybeThrow",
  description: "MaybeThrow",
  props: z.object({ value: z.string() }),
  component: ({ props }) => {
    if (props.value === "boom") throw new Error("malformed partial props");
    return <span>{props.value}</span>;
  },
});

const Stack = defineComponent({
  name: "Stack",
  description: "Stack",
  props: z.object({ items: z.array(MaybeThrow.ref) }),
  component: ({ props, renderNode }) => <div>{renderNode(props.items)}</div>,
});

const boundaryLibrary = createLibrary({ components: [Stack, MaybeThrow], root: "Stack" });

/** Mute React's expected error logging while components throw intentionally. */
function muteConsoleError() {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  return () => spy.mockRestore();
}

async function renderResponse(root: ReturnType<typeof createRoot>, response: string) {
  await act(async () => root.render(<Renderer library={boundaryLibrary} response={response} />));
}

it("unmounts a failing element instead of re-presenting stale children", async () => {
  const unmute = muteConsoleError();
  try {
    const container = document.createElement("div");
    const root = createRoot(container);
    await renderResponse(root, 'root = Stack([a])\na = MaybeThrow("hello")');
    expect(container.textContent).toContain("hello");

    // The child throws on the next (partial) response: the boundary must drop
    // the subtree, not re-render the stale "hello" elements.
    await renderResponse(root, 'root = Stack([a])\na = MaybeThrow("boom")');
    expect(container.textContent ?? "").not.toContain("hello");

    await act(async () => root.unmount());
  } finally {
    unmute();
  }
});

it("recovers and renders the next valid children after an error", async () => {
  const unmute = muteConsoleError();
  try {
    const container = document.createElement("div");
    const root = createRoot(container);
    await renderResponse(root, 'root = Stack([a])\na = MaybeThrow("hello")');
    await renderResponse(root, 'root = Stack([a])\na = MaybeThrow("boom")');
    expect(container.textContent ?? "").toBe("");

    await renderResponse(root, 'root = Stack([a])\na = MaybeThrow("back")');
    expect(container.textContent).toContain("back");

    await act(async () => root.unmount());
  } finally {
    unmute();
  }
});

it("keeps rendering streaming updates when nothing throws", async () => {
  const container = document.createElement("div");
  const root = createRoot(container);
  await renderResponse(root, 'root = Stack([a])\na = MaybeThrow("hel")');
  await renderResponse(root, 'root = Stack([a])\na = MaybeThrow("hello")');
  await renderResponse(root, 'root = Stack([a])\na = MaybeThrow("hello world")');
  expect(container.textContent).toContain("hello world");
  await act(async () => root.unmount());
});
