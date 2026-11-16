"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Popover as PopoverView } from "../../components/Popover";
import { isElement, renderSlot } from "../schemas";
import { PopoverSchema } from "./schema";

export * from "./schema";

/**
 * The trigger is already a button, so a clickable component given as the trigger would put a
 * button (or link) inside it: invalid HTML that breaks hydration. Shows what it shows instead.
 */
function plainTrigger(value: unknown): unknown {
  if (!isElement(value)) return value;
  const props = value.props;
  switch (value.typeName) {
    case "Button":
      return props.label ?? "";
    case "Link":
      return props.text ?? "";
    case "IconButton":
      return { ...value, typeName: "Icon", props: { name: props.icon, size: "sm" } };
    case "Pressable":
      return props.children;
    default:
      return value;
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
