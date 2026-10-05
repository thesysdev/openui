"use client";

import { AlertDescription, AlertTitle, Alert as ShadcnAlert } from "@/components/ui/alert";
import { defineComponent } from "@openuidev/react-lang";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { z } from "zod";

const AlertSchema = z.object({
  title: z.string(),
  description: z.string(),
  variant: z.enum(["default", "destructive", "info", "success", "warning"]).optional(),
});

const variantStyles: Record<string, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400",
  success:
    "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200 [&>svg]:text-green-600 dark:[&>svg]:text-green-400",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400",
};

const iconMap = {
  default: null,
  destructive: AlertCircle,
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
};

export const Alert = defineComponent({
  name: "Alert",
  props: AlertSchema,
  description:
    'Alert banner with icon, title, and description. variant: "default" | "destructive" | "info" | "success" | "warning".',
  component: ({ props }) => {
    const v = props.variant ?? "default";
    const shadcnVariant = v === "destructive" ? "destructive" : "default";
    const extraClass = variantStyles[v] ?? "";
    const Icon = iconMap[v as keyof typeof iconMap];

    return (
      <ShadcnAlert variant={shadcnVariant} className={extraClass}>
        {Icon && <Icon className="size-4" />}
        <AlertTitle>{props.title}</AlertTitle>
        <AlertDescription>{props.description}</AlertDescription>
      </ShadcnAlert>
    );
  },
});
