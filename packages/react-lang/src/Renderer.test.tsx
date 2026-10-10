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
