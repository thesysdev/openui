// @vitest-environment jsdom
import { parseStructuredRules, type ValidatorFn } from "@openuidev/lang-core";
import { act, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { z } from "zod/v4";
import { FormNameContext } from "../../context";
import { createLibrary, defineComponent } from "../../library";
import { Renderer } from "../../Renderer";
import {
  FormValidationContext,
  useCreateFormValidation,
  useFormValidation,
} from "../useFormValidation";
import { useStateField } from "../useStateField";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Field = defineComponent({
  name: "Field",
  description: "Field",
  props: z.object({
    name: z.string(),
    fill: z.string(),
    rules: z.record(z.string(), z.unknown()).optional(),
  }),
  component: ({ props }) => {
    const field = useStateField<string>(props.name);
    const validation = useFormValidation();
    const rules = parseStructuredRules(props.rules);
    const valueRef = useRef(field.value);
    valueRef.current = field.value;

    useEffect(() => {
      validation?.registerField(props.name, rules, () => valueRef.current);
      return () => validation?.unregisterField(props.name);
    });

    return (
      <div>
        <button data-fill={props.name} onClick={() => field.setValue(props.fill)} />
        <span data-error={props.name}>{validation?.getFieldError(props.name) ?? ""}</span>
      </div>
    );
  },
});

const Form = defineComponent({
  name: "Form",
  description: "Form",
  props: z.object({ name: z.string(), fields: z.array(Field.ref) }),
  component: ({ props, renderNode }) => {
    const validation = useCreateFormValidation();
    return (
      <FormValidationContext.Provider value={validation}>
        <FormNameContext.Provider value={props.name}>
          {renderNode(props.fields)}
          <button data-submit onClick={() => validation.validateForm()} />
        </FormNameContext.Provider>
      </FormValidationContext.Provider>
    );
  },
});

const library = createLibrary({ components: [Form, Field], root: "Form" });

const matches: ValidatorFn = (value, arg, ctx) =>
  value === ctx?.values[String(arg)] ? undefined : "Values do not match";

let cleanup: (() => Promise<void>) | undefined;
afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
});

async function renderForm(response: string, validators?: Record<string, ValidatorFn>) {
  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () =>
    root.render(<Renderer library={library} response={response} validators={validators} />),
  );
  cleanup = () => act(async () => root.unmount());

  const click = (selector: string) =>
    act(async () =>
      container.querySelector(selector)!.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
  const errorOf = (name: string) => container.querySelector(`[data-error="${name}"]`)!.textContent;
  return { click, errorOf };
}

const passwordForm = (confirmValue: string) =>
  [
    'root = Form("signup", [p, c])',
    'p = Field("password", "secret")',
    `c = Field("confirm", "${confirmValue}", {matches: "password"})`,
  ].join("\n");

it("runs a custom validator passed to Renderer with the other field values", async () => {
  const { click, errorOf } = await renderForm(passwordForm("different"), { matches });

  await click('[data-fill="password"]');
  await click('[data-fill="confirm"]');
  await click("[data-submit]");

  expect(errorOf("confirm")).toBe("Values do not match");
  expect(errorOf("password")).toBe("");
});

it("passes when the cross-field rule is satisfied", async () => {
  const { click, errorOf } = await renderForm(passwordForm("secret"), { matches });

  await click('[data-fill="password"]');
  await click('[data-fill="confirm"]');
  await click("[data-submit]");

  expect(errorOf("confirm")).toBe("");
});

it("ignores unknown rules when no validators are provided", async () => {
  const { click, errorOf } = await renderForm(passwordForm("different"));

  await click('[data-fill="password"]');
  await click('[data-fill="confirm"]');
  await click("[data-submit]");

  expect(errorOf("confirm")).toBe("");
});
