"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Popover as PopoverView } from "../../components/Popover";
import { isElement, renderSlot } from "../schemas";
import { PopoverSchema } from "./schema";

export * from "./schema";

/** Components that would draw a control (or a frame) inside the trigger's own button. */
const INTERACTIVE = new Set([
  "Button",
  "IconButton",
  "Link",
  "Pressable",
  "Checkbox",
  "Input",
  "TextArea",
  "Select",
  "Slider",
  "RadioGroup",
  "SegmentedControl",
  "DatePicker",
  "Form",
  "Timer",
  "Flashcard",
  "Carousel",
  "Popover",
  "HtmlView",
  "YouTube",
]);

/**
 * The trigger is already a button, so a control anywhere in it (in a list, or in a Row inside it)
 * would put a button, link or field inside a button: invalid HTML that breaks hydration. Each one
 * shows what it says instead: a Button its label, a Link its text, an IconButton its icon, a
 * Pressable its contents; any other control its label, or nothing.
 */
function plainTrigger(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(plainTrigger);
  if (!isElement(value)) return value;
  const props = value.props;
  if (!INTERACTIVE.has(value.typeName)) {
    const plain: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(props)) plain[key] = plainTrigger(prop);
    return { ...value, props: plain };
  }
  switch (value.typeName) {
    case "Link":
      return props.text ?? null;
    case "IconButton":
      return { ...value, typeName: "Icon", props: { name: props.icon, size: "sm" } };
    case "Pressable":
      return plainTrigger(props.children);
    default:
      return typeof props.label === "string" ? props.label : null;
  }
}

export const Popover = defineComponent({
  name: "Popover",
  props: PopoverSchema,
  description:
    'Shows content in a small panel when the trigger is clicked: a definition, a source, details behind an Icon("info", "sm"). The trigger is text or an Icon, never a Button: it is a button already.',
  component: ({ props, renderNode }) => (
    <PopoverView trigger={renderSlot(plainTrigger(props.trigger), renderNode)}>
      {renderSlot(props.content, renderNode)}
    </PopoverView>
  ),
});
