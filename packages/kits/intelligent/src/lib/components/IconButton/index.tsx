"use client";

import { IconButton as RCIconButton } from "@openuidev/react-components";
import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { useRunAction } from "../controlHelpers";
import { Glyph } from "../glyph";
import { cx } from "../style";
import { IconButtonSchema } from "./schema";

export * from "./schema";

/**
 * outline, ghost and solid map to react-components' secondary, tertiary and
 * primary. primary is the blue accent there, so the kit's
 * iui-icon-button-solid class points that accent at the kit's ink and solid
 * stays black; iui-icon-button-ghost keeps the ghost icon muted.
 */
const VARIANT = { outline: "secondary", ghost: "tertiary", solid: "primary" } as const;

export const IconButton = defineComponent({
  name: "IconButton",
  props: IconButtonSchema,
  description: "Round icon-only button; label is read aloud.",
  component: ({ props }) => {
    const run = useRunAction();
    const streaming = useIsStreaming();
    const variant = props.variant ?? "outline";
    const label = props.label || String(props.icon ?? "");
    return (
      <RCIconButton
        type="button"
        icon={<Glyph name={props.icon} size={16} />}
        variant={VARIANT[variant]}
        shape="circle"
        size="small"
        className={cx("iui-icon-button", `iui-icon-button-${variant}`)}
        aria-label={label}
        title={props.label || undefined}
        disabled={streaming}
        onClick={() => run(label, props.action, false)}
      />
    );
  },
});
