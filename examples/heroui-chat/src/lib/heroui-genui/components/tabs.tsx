"use client";

import { Tabs as HeroUITabs } from "@heroui/react";
import { type ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { useEffect, useRef, useState } from "react";
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
  description: "Single tab within a Tabs container",
  component: () => null,
});

const TabsSchema = z.object({
  items: z.array(TabItem.ref),
});

function TabsRenderer({ props, renderNode }: ComponentRenderProps<z.infer<typeof TabsSchema>>) {
  const items = props.items ?? [];
  const [activeTab, setActiveTab] = useState("");
  const userHasInteracted = useRef(false);
  const prevContentSizes = useRef<Record<string, number>>({});

  useEffect(() => {
    const first = items[0];
    if (items.length && !activeTab && first) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(first.props.value);
    }
  }, [items.length, activeTab]);

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

    if (candidate && candidate !== activeTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(candidate);
    }
  });

  if (!items.length) return null;

  return (
    <HeroUITabs
      selectedKey={activeTab}
      onSelectionChange={(key) => {
        userHasInteracted.current = true;
        setActiveTab(String(key));
      }}
    >
      <HeroUITabs.ListContainer>
        <HeroUITabs.List aria-label="Tabs">
          {items.map((item) => (
            <HeroUITabs.Tab key={item.props.value} id={item.props.value}>
              {item.props.trigger}
              <HeroUITabs.Indicator />
            </HeroUITabs.Tab>
          ))}
        </HeroUITabs.List>
      </HeroUITabs.ListContainer>
      {items.map((item) => (
        <HeroUITabs.Panel key={item.props.value} id={item.props.value}>
          <div className="space-y-3">{renderNode(item.props.content)}</div>
        </HeroUITabs.Panel>
      ))}
    </HeroUITabs>
  );
}

export const Tabs = defineComponent({
  name: "Tabs",
  props: TabsSchema,
  description: "Tabbed container",
  component: TabsRenderer,
});
