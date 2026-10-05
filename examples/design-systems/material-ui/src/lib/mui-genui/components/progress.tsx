"use client";

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const ProgressSchema = z.object({
  value: z.number(),
  label: z.string().optional(),
});

export const Progress = defineComponent({
  name: "Progress",
  props: ProgressSchema,
  description: "Progress bar showing completion percentage (0-100). Optional label.",
  component: ({ props }) => {
    const value = Math.max(0, Math.min(100, Number(props.value) || 0));
    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          {props.label && <Typography variant="body2">{props.label}</Typography>}
          <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
            {value}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={value}
          sx={{ height: 8, borderRadius: 1 }}
        />
      </Box>
    );
  },
});
