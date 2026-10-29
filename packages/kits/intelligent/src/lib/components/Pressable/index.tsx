"use client";

import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { type KeyboardEvent, type MouseEvent, useRef } from "react";
import { useRunAction } from "../controlHelpers";
import { bg, cx, onColor, radius, space, textOf } from "../style";
import { PressableSchema } from "./schema";

export * from "./schema";

export const Pressable = defineComponent({
  name: "Pressable",
  props: PressableSchema,
  description: "Makes any content clickable, such as a tile or a swatch.",
  component: function PressableView({ props, renderNode }) {
    const run = useRunAction();
    const streaming = useIsStreaming();
    const ref = useRef<HTMLDivElement>(null);
    const press = () => {
      if (!streaming) run(textOf(ref.current), props.action, false);
    };
    // Clicks meant for a control inside the tile stay with that control.
    const onClick = (event: MouseEvent<HTMLDivElement>) => {
      const target = (event.target as Element).closest("button,a,input,select,textarea,label,[role=button]");
      if (target === event.currentTarget) press();
    };
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      press();
    };
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-pressed={props.selected === undefined ? undefined : !!props.selected}
        aria-disabled={streaming || undefined}
        className={cx("iui-pressable", props.selected && "is-selected")}
        style={{ padding: space(props.padding), background: bg(props.background), ...onColor(props.background), borderRadius: radius(props.radius) }}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {renderNode(props.children)}
      </div>
    );
  },
});
