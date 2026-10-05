"use client";

import Typography from "@mui/material/Typography";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const HeadingSchema = z.object({
  text: z.string(),
  level: z.enum(["h1", "h2", "h3", "h4"]).optional(),
});

const HEADING_LEVELS = HeadingSchema.shape.level.unwrap().options;

export const Heading = defineComponent({
  name: "Heading",
  props: HeadingSchema,
  description: 'Section heading. level: "h1" | "h2" | "h3" | "h4".',
  component: ({ props }) => {
    // While streaming, `level` can briefly hold a partial value such as "h" before it
    // completes to "h2". Passing that straight to Typography's `component` prop makes
    // React try to render an invalid <h> element and log a console error, so fall back
    // to "h2" for any value that is not yet a complete, valid level.
    const level = props.level && HEADING_LEVELS.includes(props.level) ? props.level : "h2";
    return (
      <Typography variant={level} component={level} gutterBottom>
        {props.text}
      </Typography>
    );
  },
});
