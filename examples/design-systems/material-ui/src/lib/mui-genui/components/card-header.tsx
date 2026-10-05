"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const CardHeaderSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

export const CardHeader = defineComponent({
  name: "CardHeader",
  props: CardHeaderSchema,
  description: "Title/description header block for a Card.",
  component: ({ props }) => (
    <Box>
      <Typography variant="h3" component="h2">
        {props.title}
      </Typography>
      {props.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {props.description}
        </Typography>
      )}
    </Box>
  ),
});
