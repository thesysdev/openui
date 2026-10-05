"use client";

import MuiList from "@mui/material/List";
import MuiListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const ListItemSchema = z.object({
  primary: z.string(),
  secondary: z.string().optional(),
});

export const ListItemDef = defineComponent({
  name: "ListItem",
  props: ListItemSchema,
  description: "Item in a List. primary text with optional secondary text.",
  component: () => null,
});

const ListSchema = z.object({
  items: z.array(ListItemDef.ref),
  dense: z.boolean().optional(),
});

export const List = defineComponent({
  name: "List",
  props: ListSchema,
  description: "Vertical list of items. items: ListItem[]. dense for tighter spacing.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = ((props.items ?? []) as any[]).filter((it) => it?.props?.primary != null);
    if (!items.length) return null;
    return (
      <MuiList dense={props.dense} disablePadding>
        {items.map((it, i) => (
          <MuiListItem key={i} divider={i < items.length - 1} disableGutters>
            <ListItemText
              primary={String(it.props.primary)}
              secondary={it.props.secondary != null ? String(it.props.secondary) : undefined}
            />
          </MuiListItem>
        ))}
      </MuiList>
    );
  },
});
