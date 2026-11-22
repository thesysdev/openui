"use client";

import { ComponentRenderProps, defineComponent, type SubComponentOf } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import {
  Accordion as OpenUIAccordion,
  AccordionContent as OpenUIAccordionContent,
  AccordionItem as OpenUIAccordionItem,
  AccordionTrigger as OpenUIAccordionTrigger,
} from "../../components/Accordion";
import { AccordionItemSchema } from "./schema";

export { AccordionItemSchema } from "./schema";

export const AccordionItem = defineComponent({
  name: "AccordionItem",
  props: AccordionItemSchema,
  description: "value is unique id, trigger is section title",
  component: () => null,
});

type AccordionRenderProps = ComponentRenderProps<{
  items: SubComponentOf<{ value: string; trigger: string; content: unknown[] }>[];
}>;

/** Shared renderer — also used by the chat library's Accordion variant (wider content union). */
export const AccordionRenderer = ({ props, renderNode }: AccordionRenderProps) => {
  const items = props.items ?? [];
  const [openItem, setOpenItem] = React.useState<string>("");
  const userHasInteracted = React.useRef(false);
  const prevItemCount = React.useRef<number | null>(null);
  const autoOpenIndex = React.useRef(-1);

  // Open the first item when the accordion mounts with its items already there
  // (a static response, or a stream that delivered them in one chunk), then the
  // newest item each time one arrives. Track the index, not the value, so the
  // open item stays in sync while its value is still streaming in.
  if (!userHasInteracted.current) {
    if (prevItemCount.current === null) {
      if (items.length) autoOpenIndex.current = 0;
    } else if (items.length > prevItemCount.current) {
      autoOpenIndex.current = items.length - 1;
    }
    const autoOpenValue = items[autoOpenIndex.current]?.props.value;
    if (autoOpenValue && autoOpenValue !== openItem) setOpenItem(autoOpenValue);
  }
  prevItemCount.current = items.length;

  const handleValueChange = (value: string) => {
    userHasInteracted.current = true;
    setOpenItem(value);
  };

  if (!items.length) return null;

  return (
    <OpenUIAccordion type="single" collapsible value={openItem} onValueChange={handleValueChange}>
      {items.map((item) => (
        <OpenUIAccordionItem key={item.props.value} value={item.props.value}>
          <OpenUIAccordionTrigger text={item.props.trigger} />
          <OpenUIAccordionContent>{renderNode(item.props.content)}</OpenUIAccordionContent>
        </OpenUIAccordionItem>
      ))}
    </OpenUIAccordion>
  );
};

export const Accordion = defineComponent({
  name: "Accordion",
  props: z.object({
    items: z.array(AccordionItem.ref),
  }),
  description: "Collapsible sections",
  component: AccordionRenderer,
});
