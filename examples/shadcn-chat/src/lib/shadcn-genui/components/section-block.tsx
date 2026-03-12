"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { ChevronDown } from "lucide-react";
import React from "react";
import { z } from "zod";
import { SectionContentChildUnion } from "../section-content-union";

const SectionItemSchema = z.object({
  value: z.string(),
  trigger: z.string(),
  content: z.array(SectionContentChildUnion),
});

export const SectionItem = defineComponent({
  name: "SectionItem",
  props: SectionItemSchema,
  description:
    "Section with a label and collapsible content — used inside SectionBlock.",
  component: () => null,
});

const SectionBlockSchema = z.object({
  sections: z.array(SectionItem.ref),
  isFoldable: z.boolean().optional(),
});

export const SectionBlock = defineComponent({
  name: "SectionBlock",
  props: SectionBlockSchema,
  description:
    "Collapsible accordion sections. Auto-opens sections as they stream in. isFoldable=false for flat headers.",
  component: ({ props, renderNode }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.sections ?? []) as any[];
    const isFoldable = props.isFoldable !== false;
    const isStreaming = useIsStreaming();

    const [openItems, setOpenItems] = React.useState<Set<string>>(new Set());

    React.useEffect(() => {
      if (isStreaming && isFoldable) {
        const lastItem = items[items.length - 1];
        const lastVal = String(lastItem?.props?.value ?? items.length - 1);
        setOpenItems((prev) => {
          const next = new Set(prev);
          next.add(lastVal);
          return next;
        });
      }
    }, [isStreaming, items.length, isFoldable, items]);

    if (!isFoldable) {
      return (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index}>
              <h3 className="font-semibold text-sm mb-2">
                {String(item?.props?.trigger ?? "")}
              </h3>
              <div className="space-y-2">{renderNode(item?.props?.content)}</div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item, index) => {
          const val = String(item?.props?.value ?? index);
          const isOpen = openItems.has(val);
          return (
            <Collapsible
              key={index}
              open={isOpen}
              onOpenChange={(open) => {
                setOpenItems((prev) => {
                  const next = new Set(prev);
                  if (open) next.add(val);
                  else next.delete(val);
                  return next;
                });
              }}
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
                {String(item?.props?.trigger ?? "")}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pt-2 pb-3 space-y-2">
                {renderNode(item?.props?.content)}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  },
});
