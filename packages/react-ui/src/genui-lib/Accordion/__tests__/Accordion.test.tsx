// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AccordionRenderer } from "../index";

type Item = { value: string; trigger: string; content: string[] };

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (items: Item[]) => {
  const props = { items: items.map((props) => ({ props })) };
  act(() => {
    root.render(
      <AccordionRenderer
        props={props as never}
        renderNode={(content) => (content as string[]).join(" ")}
        {...({} as never)}
      />,
    );
  });
};

const openItems = () =>
  [...container.querySelectorAll('button[aria-expanded="true"]')].map((b) => b.textContent?.trim());

const apple: Item = { value: "a", trigger: "Apple", content: ["Apple section"] };
const banana: Item = { value: "b", trigger: "Banana", content: ["Banana section"] };

describe("Accordion auto-open", () => {
  it("opens the first item when it mounts with every item present", () => {
    render([apple, banana]);
    expect(openItems()).toEqual(["Apple"]);
  });

  it("opens the newest item as items stream in", () => {
    render([]);
    render([apple]);
    expect(openItems()).toEqual(["Apple"]);
    render([apple, banana]);
    expect(openItems()).toEqual(["Banana"]);
  });

  it("keeps the newest item open while its value is still streaming in", () => {
    render([apple]);
    render([apple, { ...banana, value: "ba" }]);
    render([apple, { ...banana, value: "banana" }]);
    expect(openItems()).toEqual(["Banana"]);
  });
});
