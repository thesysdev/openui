"use client";

import {
  ComponentRenderProps,
  defineComponent,
  useIsStreaming,
  type SubComponentOf,
} from "@openuidev/react-lang";
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

type TabsRenderProps = ComponentRenderProps<{
  items: SubComponentOf<{ value: string; trigger: string; content: unknown[] }>[];
}>;

/** Shared renderer — also used by the chat library's Tabs variant (wider content union). */
export const TabsRenderer = ({ props, renderNode }: TabsRenderProps) => {
  const items = (props.items ?? []).filter((item) => item?.props?.value != null);
  const isStreaming = useIsStreaming();
  const [activeTab, setActiveTab] = React.useState("");
  const userHasInteracted = React.useRef(false);
  const prevContentSizes = React.useRef<Record<string, number> | null>(null);

  React.useEffect(() => {
    const first = items[0];
    if (items.length && !activeTab && first) {
      setActiveTab(first.props.value);
    }
  }, [items.length, activeTab]);

  React.useEffect(() => {
    if (userHasInteracted.current) return;

    // Follow the tab the model is writing into, and only while it streams: on
    // the first pass every tab has "grown" from nothing, and after the stream a
    // Query resolving inside another tab grows it without the model writing.
    const baseline = prevContentSizes.current;
    let candidate: string | null = null;
    const nextSizes: Record<string, number> = {};

    for (const item of items) {
      const size = JSON.stringify(item.props.content).length;
      nextSizes[item.props.value] = size;
      if (size > (baseline?.[item.props.value] ?? 0)) {
        candidate = item.props.value;
      }
    }

    prevContentSizes.current = nextSizes;

    if (baseline && isStreaming && candidate && candidate !== activeTab) {
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
};

export const Tabs = defineComponent({
  name: "Tabs",
  props: z.object({
    items: z.array(TabItem.ref),
  }),
  description: "Tabbed container",
  component: TabsRenderer,
});
