"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Popover as PopoverView } from "../../components/Popover";
import { renderSlot } from "../helpers";
import { PopoverSchema } from "./schema";

export * from "./schema";

export const Popover = defineComponent({
  name: "Popover",
  props: PopoverSchema,
  description: 'Shows content in a small panel when the trigger is clicked: a definition, a source, details behind an Icon("info", "sm").',
  component: ({ props, renderNode }) => (
    <PopoverView trigger={renderSlot(props.trigger, renderNode)}>{renderSlot(props.content, renderNode)}</PopoverView>
  ),
});
