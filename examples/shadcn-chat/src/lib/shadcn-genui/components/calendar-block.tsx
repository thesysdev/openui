"use client";

import { Calendar } from "@/components/ui/calendar";
import { defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod";

const CalendarBlockSchema = z.object({
  mode: z.enum(["single", "multiple", "range"]).optional(),
  defaultMonth: z.string().optional(),
  numberOfMonths: z.number().optional(),
  captionLayout: z.enum(["label", "dropdown"]).optional(),
});

export const CalendarBlock = defineComponent({
  name: "CalendarBlock",
  props: CalendarBlockSchema,
  description:
    'Standalone calendar display. mode: "single" | "multiple" | "range". captionLayout: "label" | "dropdown" (default "dropdown"). numberOfMonths defaults to 1.',
  component: ({ props }) => {
    const [selected, setSelected] = React.useState<Date | undefined>();
    const [multiSelected, setMultiSelected] = React.useState<Date[]>([]);
    const [range, setRange] = React.useState<{ from: Date; to?: Date } | undefined>();

    const mode = props.mode ?? "single";
    const numberOfMonths = props.numberOfMonths ?? 1;
    const captionLayout = props.captionLayout ?? "dropdown";
    const defaultMonth = props.defaultMonth ? new Date(props.defaultMonth) : undefined;

    const common = {
      numberOfMonths,
      defaultMonth,
      captionLayout,
      className: "rounded-lg border",
    };

    if (mode === "range") {
      return (
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) => setRange(r as { from: Date; to?: Date } | undefined)}
          {...common}
        />
      );
    }

    if (mode === "multiple") {
      return (
        <Calendar
          mode="multiple"
          selected={multiSelected}
          onSelect={(d) => setMultiSelected((d ?? []) as Date[])}
          {...common}
        />
      );
    }

    return (
      <Calendar
        mode="single"
        selected={selected}
        onSelect={(d) => setSelected(d as Date | undefined)}
        {...common}
      />
    );
  },
});
