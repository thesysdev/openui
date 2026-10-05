"use client";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import MuiTabs from "@mui/material/Tabs";
import { defineComponent } from "@openuidev/react-lang";
import * as React from "react";
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
    const rawItems = (props.items ?? []) as any[];
    const items = rawItems.filter(
      (item) => item?.props?.value != null && item?.props?.trigger != null,
    );

    const [userSelected, setUserSelected] = React.useState<string | null>(null);

    const firstValue = items[0]?.props?.value as string | undefined;
    const preferredDefault = props.defaultValue ?? firstValue;
    const userSelectionValid =
      userSelected != null && items.some((item) => String(item?.props?.value) === userSelected);
    const activeTab = userSelectionValid ? userSelected : (preferredDefault ?? "");

    if (items.length === 0) return null;

    return (
      <Box>
        <MuiTabs
          value={activeTab}
          onChange={(_, val) => setUserSelected(String(val))}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          {items.map((item) => {
            const val = String(item.props.value);
            return <Tab key={val} value={val} label={String(item.props.trigger)} />;
          })}
        </MuiTabs>
        {items.map((item) => {
          const val = String(item.props.value);
          const selected = val === activeTab;
          return (
            <Box
              key={val}
              role="tabpanel"
              hidden={!selected}
              sx={{ pt: 2, flexDirection: "column", gap: 2, display: selected ? "flex" : "none" }}
            >
              {selected ? renderNode(item.props.content) : null}
            </Box>
          );
        })}
      </Box>
    );
  },
});
