"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { Avatar as OpenUIAvatar } from "../../components/Avatar";
import { AvatarSchema, type AvatarProps } from "./schema";

export * from "./schema";

function AvatarRenderer({ props, renderNode }: ComponentRenderProps<AvatarProps>) {
  return (
    <OpenUIAvatar
      name={props.name}
      src={props.src ?? undefined}
      shape={props.shape ?? undefined}
      domain={props.domain ?? undefined}
      size={props.size ?? undefined}
      icon={props.icon ? renderNode(props.icon) : undefined}
      color={props.color ?? undefined}
    />
  );
}

export const Avatar = defineComponent({
  name: "Avatar",
  props: AvatarSchema,
  description:
    'A small real image that can stand in for an Icon: a person\'s photo or a company logo. Avatar(name, src?, shape?, domain?, size?, icon?, color?). People: Avatar("Ada Lovelace", "https://…/ada.jpg", null, null, null, Icon("user", "people")) is a circle (default). Companies: Avatar("Stripe", null, "rounded", "stripe.com", null, Icon("building-2", "business")) shows the site\'s logo from its domain. ALWAYS pass an icon, even with src or domain: it renders when the image is missing or broken (without one a generic placeholder shows). Without an image, an Icon inside and a color tint make a badge: Avatar("Billing", null, "rounded", null, "md", Icon("credit-card", "finance"), "info"); color "neutral" (default) | "info" | "success" | "warning" | "danger" | "purple" | "pink" | "inverted". src must be a real URL from a tool result or the user; never invent one, pass the domain or an Icon instead. Pass only a domain you know is that company\'s own site. Which to use: a company is an Avatar with its domain; a person is an Avatar with src only when you have a real photo URL for them, otherwise Avatar("Ada Lovelace", null, null, null, null, Icon("user", "people")) with no src; a concept shown as a standalone tinted badge (size md or lg, e.g. leading a row or card) is an Avatar with icon and color; an icon on a text line (LeadingText, Tag, Chips) for a concept is a plain Icon. Pick color by meaning like Tag variants (success positive, danger negative, warning caution, info informational, neutral otherwise); use purple and pink only to tell categories apart. size "inline" (default, sits on a text line like an Icon) | "md" 32px | "lg" 48px for standalone use.',
  component: AvatarRenderer,
});
