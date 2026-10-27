"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { EntityTitle as OpenUIEntityTitle } from "../../components/EntityTitle";
import { renderIconSlot } from "../iconSlot";
import { renderOneOrMany } from "../oneOrMany";
import { EntityTitleSchema, type EntityTitleProps } from "./schema";

export * from "./schema";

type LeadingNode = { typeName?: string; props?: { name?: string } };

function EntityTitleRenderer({ props, renderNode }: ComponentRenderProps<EntityTitleProps>) {
  const leading = props.leading as LeadingNode | undefined;
  // A bare Icon becomes a neutral Avatar badge, so every leading reads as one
  // filled shape beside the text.
  const node =
    leading?.typeName === "Icon" && leading.props?.name
      ? { typeName: "Avatar", props: { name: leading.props.name, icon: leading } }
      : leading;
  return (
    <OpenUIEntityTitle
      leading={renderIconSlot(node)}
      title={props.title}
      subtitle={renderOneOrMany(props.subtitle, renderNode)}
      layout={props.layout ?? "horizontal"}
    />
  );
}

export const EntityTitle = defineComponent({
  name: "EntityTitle",
  props: EntityTitleSchema,
  description:
    'A leading visual with a title and a one-line subtitle, naming a person, company, product, place or topic, e.g. EntityTitle(Avatar("Stripe", null, "rounded", "stripe.com", null, Icon("building-2", "business")), "Stripe", "Payments infrastructure"). leading is usually an Avatar: a photo (src) for a person you have a real photo URL for, a logo (domain, shape "rounded") for a company, or a tinted icon badge (icon, color) for anything else. A bare Icon renders as a neutral badge; an Emoji also works in rare expressive content. leading is 44px, or 48px in the vertical layout; the title is 16px medium. subtitle is required. A string is one line of secondary context such as a role, category or time range. To say more on that line, compose it: a Tag for a status (EntityTitle(Avatar("Ada Lovelace", null, null, null, null, Icon("user", "people")), "Ada Lovelace", Tag("On call", null, "success"))), a Metric for a price or value with its change (Metric("$29", "-12%", null, "sm")), a Link for a source (Link("stripe.com", "https://stripe.com")), a TagBlock for a few labels, or a LeadingText for a fact with an icon. If there is nothing useful to put under the title, use LeadingText instead. Use it standalone for a list of people, companies or places, and in a CompositeCardItem header to say what the card is about. Use Heading for a section title over UI. layout "vertical" stacks the leading above the text, for narrow grid cards. When the subtitle needs two or more pieces side by side, pass them as an array and they sit on one line, e.g. [Metric("$89", null, null, "sm"), Tag("In stock", null, "success")]; a single piece goes in directly.',
  component: EntityTitleRenderer,
});
