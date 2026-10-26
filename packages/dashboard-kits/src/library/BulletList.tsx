"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { BulletList as BulletListView } from "../components/BulletList";
import { passed, type TargetProgress } from "../core/schemas";
import { Pending } from "./Pending";

export const BulletList = defineComponent({
  name: "BulletList",
  description:
    "Targets as bullet charts: the actual so far, the target to date (tick) and for the period (dashed), the forecast range, and a status: BulletList(targets.targets).",
  props: z.object({
    targets: z.array(passed("A target from a targets tool")).default([]),
  }),
  component: ({ props }) => {
    const targets = (props.targets ?? []) as unknown as TargetProgress[];
    if (targets.length === 0) return <Pending kind="list" rows={5} />;
    return <BulletListView targets={targets} />;
  },
});
