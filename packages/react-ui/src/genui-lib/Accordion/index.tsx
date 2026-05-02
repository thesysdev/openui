"use client";

import { defineComponent } from "@openuidev/react-lang";
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

export const Accordion = defineComponent({
  name: "Accordion",
  props: z.object({
    items: z.array(AccordionItem.ref),
  }),
  description: "Collapsible sections",
  component: ({ props, renderNode }) => {
    const items = props.items ?? [];
    const [openItem, setOpenItem] = React.useState<string>("");
    const userHasInteracted = React.useRef(false);
    const prevItemCount = React.useRef(0);

    // Auto-open: only when a NEW item arrives during streaming
    if (!userHasInteracted.current && items.length > prevItemCount.current) {
      const newest = items[items.length - 1];
      if (newest) setOpenItem(newest.props.value);
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
  },
});
