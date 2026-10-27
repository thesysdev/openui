"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { Bleed as OpenUIBleed } from "../../components/Bleed";
import { BleedSchema, type BleedProps } from "./schema";

export * from "./schema";

// Children are loose so the chat Bleed, with its own children union, can share this renderer.
type BleedRenderProps = ComponentRenderProps<
  Omit<BleedProps, "children"> & { children: unknown[] }
>;

/** Shared renderer — also used by the chat library's Bleed variant (typed children). */
export function BleedRenderer({ props, renderNode }: BleedRenderProps) {
  return <OpenUIBleed>{renderNode(props.children)}</OpenUIBleed>;
}

export const BLEED_DESCRIPTION = `Frameless content wider than the chat column, for expressive layouts: Bleed(children). Same breakout as Shell but with no header, outline or expand button; on narrow screens it just fills the column. Children stack top to bottom, 12px apart. Use it sparingly, for a part that benefits from width: a wide hero Image, a wide comparison Grid, an editorial layout or a wide Carousel, e.g. Bleed([Image("Lisbon at dusk", url, "16:9"), Grid([c1, c2, c3], 3)]). When a Grid must compare an odd number of cards side by side, such as 3 or 5 plans or options, wrap it in a Bleed so they sit in one wide row instead of wrapping into an uneven 2 + 1: Bleed([Grid([plan1, plan2, plan3], 3)]). Never nest a Bleed or Shell inside it; for a dashboard with an expand button use Shell.`;

export const Bleed = defineComponent({
  name: "Bleed",
  props: BleedSchema,
  description: BLEED_DESCRIPTION,
  component: BleedRenderer,
});
