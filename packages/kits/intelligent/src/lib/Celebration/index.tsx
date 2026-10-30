"use client";

import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { Celebration as CelebrationView } from "../../components/Celebration";
import { CelebrationSchema } from "./schema";

export * from "./schema";

export const Celebration = defineComponent({
  name: "Celebration",
  props: CelebrationSchema,
  description: "Bursts confetti when its condition turns true, e.g. Celebration($score == 5) at the end of a quiz.",
  component: function CelebrationBinding({ props }) {
    const streaming = useIsStreaming();
    return <CelebrationView when={props.when === true} paused={streaming} />;
  },
});
