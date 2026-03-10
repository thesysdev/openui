"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { SectionContentChildUnion } from "../sectionContentUnion";

export const SectionItem = defineComponent({
  name: "SectionItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(SectionContentChildUnion),
  }),
  description: "Section with a label and collapsible content — used inside SectionBlock",
  component: () => null,
});
