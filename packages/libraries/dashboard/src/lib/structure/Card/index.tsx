"use client";

import { defineComponent, useIsStreaming, type ComponentRenderProps } from "@openuidev/react-lang";
import { Card, type CardProps } from "../../../components/structure/Card";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { cardPropsSchema, type CardSchemaProps } from "./schema";

export const CardComponent = defineComponent({
  name: "Card",
  props: cardPropsSchema,
  description:
    'content stacks top to bottom, usually [Stat?, one visual]. Default width "half". title says what is plotted; subtitle gives units, period or source ("Weekly · USD"). controls are this card\'s own switches, shown in its header: a ChipFilter or SelectFilter for what the card is broken down by or which metric it plots, e.g. Card("Top sources", [Leaderboard(...)], "half", "Visitors", [ChipFilter("sourceBy", [{value: "channel", label: "Channel"}, {value: "domain", label: "Domain"}], $sourceBy)]).',
  component: CardView,
});

function CardView({ props, renderNode }: ComponentRenderProps<CardSchemaProps>) {
  const streaming = useIsStreaming();
  return (
    <Card
      title={props.title}
      width={props.width}
      subtitle={props.subtitle}
      streaming={streaming}
      hasContent={Array.isArray(props.content) && props.content.length > 0}
      hasControls={Array.isArray(props.controls) && props.controls.length > 0}
      controls={
        Array.isArray(props.controls) && props.controls.length ? renderNode(props.controls) : null
      }
    >
      {renderNode(props.content)}
    </Card>
  );
}

// Every schema field reaches Card (content is rendered into children).
export type CardSchemaCovered = Covered<SchemaCoverage<CardSchemaProps, CardProps, "content">>;
