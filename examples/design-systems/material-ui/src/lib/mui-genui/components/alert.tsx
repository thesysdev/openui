"use client";

import MuiAlert, { type AlertColor } from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const AlertSchema = z.object({
  title: z.string(),
  description: z.string(),
  variant: z.enum(["default", "destructive", "info", "success", "warning"]).optional(),
});

const severityMap: Record<string, AlertColor> = {
  default: "info",
  destructive: "error",
  info: "info",
  success: "success",
  warning: "warning",
};

export const Alert = defineComponent({
  name: "Alert",
  props: AlertSchema,
  description:
    'Alert banner with icon, title, and description. variant: "default" | "destructive" | "info" | "success" | "warning".',
  component: ({ props }) => {
    const severity = severityMap[props.variant ?? "default"] ?? "info";
    return (
      <MuiAlert severity={severity} variant="outlined">
        <AlertTitle>{props.title}</AlertTitle>
        {props.description}
      </MuiAlert>
    );
  },
});
