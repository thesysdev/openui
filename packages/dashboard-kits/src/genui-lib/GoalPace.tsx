"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { GoalPace as GoalPaceView } from "../components/Charts/GoalPace";
import { goalSchema } from "../core/schemas";
import { Pending } from "./Pending";

export const GoalPace = defineComponent({
  name: "GoalPace",
  description:
    "Progress toward a goal for a calendar period (a monthly sales target): a gauge with a tick where the pace says it should be, whether it is on pace and where it will finish, and the running total against the straight-line pace. Pass a goal tool's result: GoalPace(goal).",
  props: z.object({
    goal: goalSchema,
  }),
  component: ({ props }) => {
    const goal = props.goal;
    // A goal whose day labels or running total have not arrived waits, rather
    // than crashing on a missing array.
    if (
      !goal ||
      !Array.isArray(goal.labels) ||
      !Array.isArray(goal.cumulative) ||
      goal.labels.length === 0 ||
      goal.cumulative.length === 0 ||
      !(goal.goal > 0)
    ) {
      return <Pending kind="hero" />;
    }
    return <GoalPaceView goal={goal} />;
  },
});
