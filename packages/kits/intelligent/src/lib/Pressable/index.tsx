"use client";

import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { Pressable as PressableView } from "../../components/Pressable";
import { textOf } from "../../shared/style";
import { useRunAction } from "../controlHelpers";
import { PressableSchema } from "./schema";

export * from "./schema";

export const Pressable = defineComponent({
  name: "Pressable",
  props: PressableSchema,
  description: "Makes any content clickable, such as a tile or a swatch.",
  component: function PressableBinding({ props, renderNode }) {
    const run = useRunAction();
    const streaming = useIsStreaming();
    return (
      <PressableView
        onPress={(element) => run(textOf(element), props.action, false)}
        selected={props.selected}
        disabled={streaming}
        padding={props.padding}
        background={props.background}
        radius={props.radius}
      >
        {renderNode(props.children)}
      </PressableView>
    );
  },
});
