"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Hr } from "@react-email/components";
import { z } from "zod";

export const EmailDivider = defineComponent({
  name: "EmailDivider",
  props: z.object({}),
  description: "Horizontal divider line to separate email sections.",
  component: () => <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />,
});
