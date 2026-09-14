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
    const prevItemCount = React.useRef<number | null>(null);
    const autoOpenIndex = React.useRef(-1);

    // Auto-open: the FIRST item on the baseline pass (a static response
    // mounts with all items already present, which is growth from 0 and
    // must not open the newest), then the newest item whenever one arrives
    // during streaming. Tracking the index rather than the value keeps the
    // open section in sync while its value string is still streaming in.
    if (!userHasInteracted.current) {
      if (prevItemCount.current === null) {
        if (items.length) autoOpenIndex.current = 0;
      } else if (items.length > prevItemCount.current) {
        autoOpenIndex.current = items.length - 1;
      }
      const autoOpenValue = items[autoOpenIndex.current]?.props.value;
      if (autoOpenValue && autoOpenValue !== openItem) {
        setOpenItem(autoOpenValue);
      }
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
