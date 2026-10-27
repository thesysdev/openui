"use client";

import { ComponentRenderProps, defineComponent, type SubComponentOf } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import {
  Tabs as OpenUITabs,
  TabsContent as OpenUITabsContent,
  TabsList as OpenUITabsList,
  TabsTrigger as OpenUITabsTrigger,
} from "../../components/Tabs";
import { renderIconSlot } from "../iconSlot";
import { TabItemSchema } from "./schema";

export { TabItemSchema } from "./schema";

export const TabItem = defineComponent({
  name: "TabItem",
  props: TabItemSchema,
  description:
    'One tab: TabItem(value, trigger, content, leading?), e.g. TabItem("growth", "User growth", [growthChart], Icon("trending-up", "charts")). value is a unique id; trigger is the short pill label, one to three words; content is what the tab shows. leading is optional: an Icon per view, an inline Avatar (with an icon) for a person\'s tab, or an Emoji only in rare expressive content. Give every tab a leading or none of them.',
  component: () => null,
});

type TabsRenderProps = ComponentRenderProps<{
  items: SubComponentOf<{
    value: string;
    trigger: string;
    content: unknown[];
    leading?: unknown;
  }>[];
}>;

/** Shared renderer — also used by the chat library's Tabs variant (wider content union). */
export const TabsRenderer = ({ props, renderNode }: TabsRenderProps) => {
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
    <OpenUITabs className="openui-genui-tabs" value={activeTab} onValueChange={handleValueChange}>
      <OpenUITabsList>
        {items.map((item) => (
          <OpenUITabsTrigger
            key={item.props.value}
            value={item.props.value}
            text={item.props.trigger}
            icon={item.props.leading ? renderIconSlot(item.props.leading) : undefined}
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
  description:
    "Pill tabs that switch between alternative views of the same thing, such as one dataset as a chart and a table, or the same plan by season: Tabs([tab1, tab2]). Only one view shows at a time, so never hide primary information that the reader needs to compare side by side in a tab. Keep it to 2–5 tabs with short labels. For distinct parts of a response use Sections, and for supplementary on-demand detail use Accordion.",
  component: TabsRenderer,
});
