"use client";

import MuiAccordion, { type AccordionProps } from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { defineComponent } from "@openuidev/react-lang";
import * as React from "react";
import { z } from "zod";
import { ContentChildUnion } from "../unions";

const AccordionItemSchema = z.object({
  value: z.string(),
  trigger: z.string(),
  content: z.array(ContentChildUnion),
});

export const AccordionItemDef = defineComponent({
  name: "AccordionItem",
  props: AccordionItemSchema,
  description: "Collapsible item inside Accordion. value: unique id, trigger: header text.",
  component: () => null,
});

const AccordionSchema = z.object({
  items: z.array(AccordionItemDef.ref),
  type: z.enum(["single", "multiple"]).optional(),
});

export const Accordion = defineComponent({
  name: "Accordion",
  props: AccordionSchema,
  description: 'Collapsible sections. type: "single" | "multiple". items: AccordionItem[].',
  component: ({ props, renderNode }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.items ?? []) as any[];
    const single = (props.type ?? "multiple") === "single";
    const [expanded, setExpanded] = React.useState<string | false>(false);

    if (!items.length) return null;

    return (
      <Box>
        {items.map((item, i) => {
          const val = String(item?.props?.value ?? i);
          const ctrl: Partial<AccordionProps> = single
            ? {
                expanded: expanded === val,
                onChange: (_, isExpanded) => setExpanded(isExpanded ? val : false),
              }
            : { defaultExpanded: i === 0 };
          return (
            <MuiAccordion key={val} disableGutters {...ctrl}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 600 }}>
                  {String(item?.props?.trigger ?? "")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {renderNode(item?.props?.content)}
                </Box>
              </AccordionDetails>
            </MuiAccordion>
          );
        })}
      </Box>
    );
  },
});
