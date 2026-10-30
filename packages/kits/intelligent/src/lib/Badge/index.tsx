"use client";

import { Tag } from "@openuidev/react-components";
import { defineComponent } from "@openuidev/react-lang";
import { Glyph } from "../../components/Icon/Glyph";
import { BadgeSchema } from "./schema";
import { cx, str } from "../../shared/style";

export * from "./schema";

/**
 * Tag covers five of the schema's seven colours exactly. "purple" and "pink"
 * have no counterpart, so those two fall back to Tag's neutral and the kit's
 * own class supplies the colour -- the same approach Checkbox uses to keep
 * lineThrough. openui-intelligent-badge stays on every badge for the kit's layout rules: no
 * shrinking in a Row, aligned inside Text, closer under a Title.
 */
const VARIANT = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
  purple: "neutral",
  pink: "neutral",
} as const;

const UNMAPPED = new Set(["purple", "pink"]);

export const Badge = defineComponent({
  name: "Badge",
  props: BadgeSchema,
  description: "Pill tag; icon is an optional leading lucide name.",
  component: ({ props }) => {
    const color = props.color ?? "neutral";
    return (
      <Tag
        text={str(props.text)}
        variant={VARIANT[color]}
        size="sm"
        icon={props.icon ? <Glyph name={props.icon} size={14} /> : undefined}
        className={cx("openui-intelligent-badge", UNMAPPED.has(color) && `openui-intelligent-badge-${color}`)}
      />
    );
  },
});
