"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod";
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
    const [openItem, setOpenItem] = React.useState("");
    const userHasInteracted = React.useRef(false);
    const prevContentSizes = React.useRef<Record<string, number>>({});

    React.useEffect(() => {
      const first = items[0];
      if (items.length && !openItem && first) {
        setOpenItem(first.props.value);
      }
    }, [items.length, openItem]);

    React.useEffect(() => {
      if (userHasInteracted.current) return;

      let candidate: string | null = null;
      const nextSizes: Record<string, number> = {};

      for (const item of items) {
        const size = JSON.stringify(item.props.content).length;
        const prevSize = prevContentSizes.current[item.props.value] ?? 0;
        nextSizes[item.props.value] = size;
        if (size > prevSize) {
          candidate = item.props.value;
        }
      }

      prevContentSizes.current = nextSizes;

      if (candidate && candidate !== openItem) {
        setOpenItem(candidate);
      }
    });

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
