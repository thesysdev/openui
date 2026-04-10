"use client";

import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { MarkDownRenderer } from "../../components/MarkDownRenderer";
import { Steps as OpenUISteps, StepsItem as OpenUIStepsItem } from "../../components/Steps";
import { StepsItemSchema } from "./schema";

export { StepsItemSchema } from "./schema";

export const StepsItem = defineComponent({
  name: "StepsItem",
  props: StepsItemSchema,
  description: "title and details text for one step",
  component: () => null,
});

export const Steps = defineComponent({
  name: "Steps",
  props: z.object({
    items: z.array(StepsItem.ref),
  }),
  description: "Step-by-step guide",
  component: ({ props, renderNode }) => {
    const items = props.items ?? [];
    return (
      <OpenUISteps>
        {items.map((item, i) => {
          const details = item.props.details;
          const detailsContent =
            typeof details === "string" ? (
              <MarkDownRenderer textMarkdown={details} />
            ) : (
              (renderNode(details) as React.ReactElement)
            );

          return (
            <OpenUIStepsItem
              key={i}
              number={i + 1}
              title={item.props.title}
              details={detailsContent}
            />
          );
        })}
      </OpenUISteps>
    );
  },
});
