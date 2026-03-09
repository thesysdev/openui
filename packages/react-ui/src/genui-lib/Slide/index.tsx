"use client";

import { defineComponent } from "@openuidev/lang-react";
import { z } from "zod";
import { ContentChildUnion } from "../unions";

export const Slide = defineComponent({
  name: "Slide",
  props: z.object({
    children: z.array(ContentChildUnion),
  }),
  description: "Content slide for use inside Carousel",
  component: ({ props, renderNode }) => <>{renderNode(props.children)}</>,
});
