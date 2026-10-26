// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
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

// ── smoothStreaming ──────────────────────────────────────────────────────────

const Note = defineComponent({
  name: "Note",
  description: "Note",
  props: z.object({ text: z.string() }),
  component: ({ props }) => <i>{props.text}</i>,
});
const Num = defineComponent({
  name: "Num",
  description: "Num",
  props: z.object({ value: z.any() }),
  component: ({ props }) => <b>{String(props.value)}</b>,
});
const Card = defineComponent({
  name: "Card",
  description: "Card",
  props: z.object({ title: z.string(), body: z.string() }),
  component: ({ props }) => <section>{`${props.title}:${props.body}`}</section>,
});
// Children typed as real libraries type them, so validation sees the pending slots
const Stack = defineComponent({
  name: "Stack",
  description: "Stack",
  props: z.object({ children: z.array(z.union([Note.ref, Num.ref, Card.ref])) }),
  component: ({ props, renderNode }) => <div>{renderNode(props.children)}</div>,
});
const streamLibrary = createLibrary({ components: [Stack, Note, Num, Card], root: "Stack" });

/** Renders each prefix of `src` while streaming, then `src` complete; returns the DOM at each step. */
async function streamPrefixes(src: string, props: { smoothStreaming?: boolean } = {}) {
  const container = document.createElement("div");
  const root = createRoot(container);
  const show = (response: string, isStreaming: boolean) =>
    act(async () =>
      root.render(
        <Renderer
          library={streamLibrary}
          response={response}
          isStreaming={isStreaming}
          {...props}
        />,
      ),
    );
  const steps: { text: string; html: string }[] = [];
  for (let i = 1; i <= src.length; i++) {
    await show(src.slice(0, i), true);
    steps.push({ text: container.textContent ?? "", html: container.innerHTML });
  }
  await show(src, false);
  const end = { text: container.textContent ?? "", html: container.innerHTML };
  await act(async () => root.unmount());
  return { steps, end };
}

const outOfOrder =
  'root = Stack([a, b, c])\nc = Note("Gamma")\nb = Note("Beta")\na = Note("Alpha")';

it("smoothStreaming shows children only in written order while streaming", async () => {
  const { steps, end } = await streamPrefixes(outOfOrder, { smoothStreaming: true });
  for (const { text } of steps) expect("AlphaBetaGamma".startsWith(text)).toBe(true);
  expect(end.text).toBe("AlphaBetaGamma");
});

it("smoothStreaming shows content after a never-written ref when the stream ends", async () => {
  const src = 'root = Stack([a, x, b])\na = Note("A")\nb = Note("B")';
  const { steps, end } = await streamPrefixes(src, { smoothStreaming: true });
  expect(steps.at(-1)!.text).toBe("A");
  expect(end.text).toBe("AB");
});

it("smoothStreaming holds later siblings of an inline component waiting for a ref", async () => {
  const src = 'root = Stack([Card("T", body), footer])\nfooter = Note("Footer")\nbody = "the body"';
  const { steps, end } = await streamPrefixes(src, { smoothStreaming: true });
  expect(steps.some(({ text }) => text.startsWith("Footer"))).toBe(false);
  expect(end.text).toBe("T:the bodyFooter");
});

it("smoothStreaming off renders the same DOM as without the prop", async () => {
  const today = await streamPrefixes(outOfOrder);
  const off = await streamPrefixes(outOfOrder, { smoothStreaming: false });
  expect(off).toEqual(today);
  // Today a later sibling can show first
  expect(today.steps.some(({ text }) => text.startsWith("Gamma"))).toBe(true);
});

it("smoothStreaming does not change @Count over a list still streaming", async () => {
  const src =
    "root = Stack([Num(@Count($rows)), Num(@Count(items))])\n$rows = [r1, r2]\nitems = [r1, r2]\nr1 = 1\nr2 = 2";
  const on = await streamPrefixes(src, { smoothStreaming: true });
  const off = await streamPrefixes(src);
  expect(on.steps.map((s) => s.text)).toEqual(off.steps.map((s) => s.text));
  expect(on.end.text).toBe("22");
});
