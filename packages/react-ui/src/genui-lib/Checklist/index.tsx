"use client";

import { defineComponent, useIsStreaming, useStateField } from "@openuidev/react-lang";
import React from "react";
import { Timeline as OpenUITimeline } from "../../components/Timeline";
import { renderOneOrMany } from "../oneOrMany";
import { ChecklistItemSchema, createChecklistSchema } from "./schema";

export { ChecklistItemSchema } from "./schema";

export const ChecklistItem = defineComponent({
  name: "ChecklistItem",
  props: ChecklistItemSchema,
  description:
    'One item in a Checklist: ChecklistItem(title, subtitle?, checked?, value?). title is the task, a string or a Text, Link or Tag. subtitle is one line of context: a string, or a Text, Metric, Tag, TagBlock, LeadingText or Link. checked true starts it ticked; leave it out for items still to do. value is the key the tick is stored under in the Checklist value, such as "flights"; give every item one when the Checklist has a name or value. When title or subtitle needs two or more pieces side by side, pass an array.',
  component: () => null,
});

export const Checklist = defineComponent({
  name: "Checklist",
  props: createChecklistSchema(ChecklistItem),
  description:
    'A list of items with round checks: Checklist(items, name?, value?), e.g. Checklist([ChecklistItem("Book flights", "Paris, Mar 12–19", true, "flights"), ChecklistItem("Reserve hotel", "Saint-Germain, 7 nights", false, "hotel"), ChecklistItem("Get travel insurance", null, false, "insurance")], "trip-prep"). On its own the user can tick it: clicking a row, or pressing Space or Enter, toggles it, and checked rows strike through in secondary. checked on an item is its starting state. Give the Checklist a name, or bind value to a $variable holding { itemValue: boolean }, when the ticks should be kept or read back; without either, ticks live only on screen. Inside a CompositeCardItem body it is read-only, so use it there for what a plan or tier includes (checked true) or what is already done. Use it for packing lists, launch or onboarding checklists and to-dos. Use Steps for numbered instructions done in order and Timeline for time-ordered events.',
  component: ({ props, renderNode }) => {
    const isStreaming = useIsStreaming();
    const items = (props.items ?? []) as {
      props?: { title?: unknown; subtitle?: unknown; checked?: boolean; value?: string };
    }[];
    const keyOf = (item: (typeof items)[number], index: number) =>
      item?.props?.value || `item-${index + 1}`;

    // A name or a bound $variable keeps the ticks in state the agent can read;
    // otherwise they live in local state for this render only.
    const field = useStateField(props.name ?? "", props.value);
    const persisted = Boolean(props.name) || props.value != null;
    const [local, setLocal] = React.useState<Record<string, boolean>>({});
    const stored = (persisted ? field.value : local) as Record<string, boolean> | undefined;

    const isChecked = (item: (typeof items)[number], index: number) =>
      stored?.[keyOf(item, index)] ?? item?.props?.checked === true;

    const cell = (value: unknown) => renderOneOrMany(value, renderNode);

    // Inside a CompositeCard body a Checklist lists what a plan or tier
    // includes, so it renders read-only there: no toggle, hover or checkbox role.
    const hostRef = React.useRef<HTMLDivElement>(null);
    const [readOnly, setReadOnly] = React.useState(false);
    React.useLayoutEffect(() => {
      setReadOnly(Boolean(hostRef.current?.closest(".openui-composite-card__body")));
    }, []);

    const toggle = (index: number) => {
      const next: Record<string, boolean> = {};
      items.forEach((item, i) => {
        next[keyOf(item, i)] = isChecked(item, i);
      });
      const key = keyOf(items[index]!, index);
      next[key] = !next[key];
      if (persisted) field.setValue(next);
      else setLocal(next);
    };

    return (
      <div ref={hostRef} style={{ display: "contents" }}>
        <OpenUITimeline
          marker="check"
          onToggle={readOnly ? undefined : toggle}
          disabled={isStreaming}
          items={items.map((item, i) => ({
            title: cell(item?.props?.title),
            subtitle: cell(item?.props?.subtitle),
            checked: isChecked(item, i),
          }))}
        />
      </div>
    );
  },
});
