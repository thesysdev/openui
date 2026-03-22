"use client";

import { Accordion as HeroUIAccordion } from "@heroui/react";
import { type ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { ContentChildUnion } from "../unions";

const AccordionItemSchema = z.object({
  value: z.string(),
  trigger: z.string(),
  content: z.array(ContentChildUnion),
});

export const AccordionItem = defineComponent({
  name: "AccordionItem",
  props: AccordionItemSchema,
  description: "Single section within an Accordion",
  component: () => null,
});

const AccordionSchema = z.object({
  items: z.array(AccordionItem.ref),
});

function AccordionRenderer({
  props,
  renderNode,
}: ComponentRenderProps<z.infer<typeof AccordionSchema>>) {
  const items = props.items ?? [];
  const [expandedKeys, setExpandedKeys] = useState(new Set<string | number>());
  const userHasInteracted = useRef(false);
  const prevContentSizes = useRef<Record<string, number>>({});

  useEffect(() => {
    const first = items[0];
    if (items.length && expandedKeys.size === 0 && first) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedKeys(new Set([first.props.value]));
    }
  }, [items.length, expandedKeys.size]);

  useEffect(() => {
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

    if (candidate && !expandedKeys.has(candidate)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedKeys(new Set([candidate]));
    }
  });

  if (!items.length) return null;

  return (
    <HeroUIAccordion
      variant="surface"
      expandedKeys={expandedKeys}
      onExpandedChange={(keys) => {
        userHasInteracted.current = true;
        setExpandedKeys(keys);
      }}
    >
      {items.map((item) => (
        <HeroUIAccordion.Item key={item.props.value} id={item.props.value}>
          <HeroUIAccordion.Heading>
            <HeroUIAccordion.Trigger>
              {item.props.trigger}
              <HeroUIAccordion.Indicator />
            </HeroUIAccordion.Trigger>
          </HeroUIAccordion.Heading>
          <HeroUIAccordion.Panel>
            <HeroUIAccordion.Body>
              <div className="space-y-3">{renderNode(item.props.content)}</div>
            </HeroUIAccordion.Body>
          </HeroUIAccordion.Panel>
        </HeroUIAccordion.Item>
      ))}
    </HeroUIAccordion>
  );
}

export const Accordion = defineComponent({
  name: "Accordion",
  props: AccordionSchema,
  description: "Collapsible sections",
  component: AccordionRenderer,
});
