"use client";

import {
  Tabs as ShadcnTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { ContentChildUnion } from "../unions";

const TabItemSchema = z.object({
  value: z.string(),
  trigger: z.string(),
  content: z.array(ContentChildUnion),
});

export const TabItem = defineComponent({
  name: "TabItem",
  props: TabItemSchema,
  description: "Tab panel. value: unique id, trigger: tab label, content: children.",
  component: () => null,
});

const TabsSchema = z.object({
  items: z.array(TabItem.ref),
  defaultValue: z.string().optional(),
});

export const Tabs = defineComponent({
  name: "Tabs",
  props: TabsSchema,
  description: "Tabbed content. items: TabItem[]. defaultValue: initially active tab.",
  component: ({ props, renderNode }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.items ?? []) as any[];
    const defaultVal =
      props.defaultValue ?? (items[0]?.props?.value as string | undefined) ?? "0";

    return (
      <ShadcnTabs defaultValue={defaultVal}>
        <TabsList>
          {items.map((item, i) => (
            <TabsTrigger key={i} value={String(item?.props?.value ?? i)}>
              {String(item?.props?.trigger ?? "")}
            </TabsTrigger>
          ))}
        </TabsList>
        {items.map((item, i) => (
          <TabsContent
            key={i}
            value={String(item?.props?.value ?? i)}
            className="space-y-3"
          >
            {renderNode(item?.props?.content)}
          </TabsContent>
        ))}
      </ShadcnTabs>
    );
  },
});
