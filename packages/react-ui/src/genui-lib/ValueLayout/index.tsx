"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ValueCardRenderer, ValueCardSchema, type ValueCardProps } from "../ValueCard";

// Its own schema object (same shape as ValueCard's) so the two register as
// separate components rather than sharing one schema definition.
// ValueLayout is informational only, so it has no action.
const { action: _action, ...valueLayoutShape } = ValueCardSchema.shape;
void _action;
const ValueLayoutSchema = z.object(valueLayoutShape);

function ValueLayoutRenderer(props: ComponentRenderProps<z.infer<typeof ValueLayoutSchema>>) {
  return (
    <div className="openui-value-layout">
      <ValueCardRenderer {...(props as unknown as ComponentRenderProps<ValueCardProps>)} />
    </div>
  );
}

export const ValueLayout = defineComponent({
  name: "ValueLayout",
  props: ValueLayoutSchema,
  description:
    'A lighter ValueCard: the same ValueCardItems, laid out in a grid or carousel with dashed rules between them instead of tinted cards. ValueLayout([item1, item2, item3], layout?, responsive?, gap?, carousel?), e.g. ValueLayout([ValueCardItem("revenue", "Revenue", "Month to date", Icon("circle-dollar-sign", "finance"), Metric("$48,200", "+8.1%", null, "sm")), ValueCardItem("orders", "Orders", "Month to date", Icon("shopping-cart", "shopping"), Metric("1,204", "+3.4%", null, "sm"))]). It follows every ValueCard rule: 2 or more items of the same shape, layout set once on the group, "horizontal" only when every value is one short piece and "vertical" otherwise, and carousel for vertical only. It has no action: it is informational only, so use ValueCard if the figures must be clickable. Use ValueLayout as an inline section of figures inside a normal UI response, such as key numbers in an answer about a company, city or product, where tinted cards would feel heavy. Use ValueCard for dashboard-like output, such as an analytics or monitoring view.',
  component: ValueLayoutRenderer,
});
