"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import {
  Tabs as OpenUITabs,
  TabsContent as OpenUITabsContent,
  TabsList as OpenUITabsList,
  TabsTrigger as OpenUITabsTrigger,
} from "../../components/Tabs";
import { TabItemSchema } from "./schema";

export { TabItemSchema } from "./schema";

export const TabItem = defineComponent({
  name: "TabItem",
  props: TabItemSchema,
  description: "value is unique id, trigger is tab label, content is array of components",
  component: () => null,
});

export const Tabs = defineComponent({
  name: "Tabs",
  props: z.object({
    items: z.array(TabItem.ref),
  }),
  description: "Tabbed container",
  component: ({ props, renderNode }) => {
    const items = (props.items ?? []).filter((item) => item?.props?.value != null);
    const [activeTab, setActiveTab] = React.useState("");
    const userHasInteracted = React.useRef(false);
    const prevContentSizes = React.useRef<Record<string, number>>({});

    React.useEffect(() => {
      const first = items[0];
      if (items.length && !activeTab && first) {
        setActiveTab(first.props.value);
      }
    }, [items.length, activeTab]);

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

      if (candidate && candidate !== activeTab) {
        setActiveTab(candidate);
      }
    });

    const handleValueChange = (value: string) => {
      userHasInteracted.current = true;
      setActiveTab(value);
    };

    if (!items.length) return null;

    return (
      <OpenUITabs value={activeTab} onValueChange={handleValueChange}>
        <OpenUITabsList>
          {items.map((item) => (
            <OpenUITabsTrigger
              key={item.props.value}
              value={item.props.value}
              text={item.props.trigger}
            />
          ))}
        </OpenUITabsList>
        {items.map((item) => (
          <OpenUITabsContent key={item.props.value} value={item.props.value}>
            {renderNode(item.props.content)}
          </OpenUITabsContent>
        ))}
      </OpenUITabs>
    );
  },
});
