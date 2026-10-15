"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { Fragment } from "react";
import { AvatarStack as OpenUIAvatarStack } from "../../components/AvatarStack";
import { AvatarStackSchema, type AvatarStackProps } from "./schema";

export * from "./schema";

type ElementNode = { props?: Record<string, unknown> };

function AvatarStackRenderer({ props, renderNode }: ComponentRenderProps<AvatarStackProps>) {
  const size = props.size ?? "md";
  const all = (props.avatars ?? []) as ElementNode[];
  const max = props.max && props.max > 0 ? Math.floor(props.max) : all.length;
  const shown = all.slice(0, max);
  return (
    <OpenUIAvatarStack
      size={size}
      overflow={all.length - shown.length}
      shapes={shown.map((n) => (n.props?.["shape"] === "rounded" ? "rounded" : "circle"))}
    >
      {shown.map((node, i) => (
        // Every avatar in the stack takes the stack's size.
        <Fragment key={i}>{renderNode({ ...node, props: { ...node.props, size } })}</Fragment>
      ))}
    </OpenUIAvatarStack>
  );
}

export const AvatarStack = defineComponent({
  name: "AvatarStack",
  props: AvatarStackSchema,
  description:
    'Several Avatars overlapped left to right, for a group of real people or companies: a team, attendees, who replied, investors in a round. AvatarStack([a1, a2, a3, a4, a5], 3) shows three and a "2" count chip. Use it for 2 or more; a single one is an Avatar. max caps how many show, keep it 3–5. size "inline" | "md" (default) | "lg" applies to every avatar, so set it on the stack, not on each Avatar. Each Avatar follows the Avatar rules: a real photo src or a company domain, and always an icon. A stack does not say who is in it, so name the group in Text beside it, usually with LeadingText.',
  component: AvatarStackRenderer,
});
