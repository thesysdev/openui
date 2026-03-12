"use client";

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const KbdSchema = z.object({
  keys: z.array(z.string()),
});

export const Kbd = defineComponent({
  name: "Kbd",
  props: KbdSchema,
  description: "Keyboard shortcut display. keys: array of key labels joined with +.",
  component: ({ props }) => {
    const keys = (props.keys ?? []) as string[];
    return (
      <span className="inline-flex items-center gap-0.5">
        {keys.map((key, i) => (
          <span key={i} className="inline-flex items-center">
            {i > 0 && <span className="mx-0.5 text-muted-foreground text-xs">+</span>}
            <kbd className="pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground select-none">
              {key}
            </kbd>
          </span>
        ))}
      </span>
    );
  },
});
