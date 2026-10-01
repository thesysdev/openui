// Text at headline sizes, replacing OpenUI's TextContent in the F1 library.
// The model picks a size by role (h1 for the answer, h2 for a card's title, h3 for a section,
// small for a caption); the sizes, weights and colours are fixed here so every answer reads
// the same.
import { defineComponent } from "@openuidev/react-lang";
import { TextContentWrapper } from "@openuidev/react-ui";
import type { CSSProperties } from "react";
import { z } from "zod/v4";

const sizes = ["h1", "h2", "h3", "default", "small", "small-heavy"] as const;

const F1_FONT = '"Titillium Web", system-ui, sans-serif';

const headline: Record<"h1" | "h2" | "h3", CSSProperties> = {
  h1: { font: `700 32px/1.15 ${F1_FONT}`, letterSpacing: "-0.005em" },
  h2: { font: `600 24px/1.2 ${F1_FONT}` },
  h3: { font: `600 18px/1.25 ${F1_FONT}` },
};

export const TextContent = defineComponent({
  name: "TextContent",
  props: z.object({ text: z.string(), size: z.enum(sizes).optional() }),
  description:
    'Text with markdown. size: "h1" (the headline of an answer) | "h2" (a card\'s title or an intro line) | "h3" (a section title or a driver\'s name) | "default" (body) | "small" (a caption or the scope of a card, muted) | "small-heavy" (a short bold label above a table).',
  component: ({ props }) => {
    const size = props.size ?? "default";
    const text = props.text == null ? "" : String(props.text);
    if (size === "h1" || size === "h2" || size === "h3") {
      const Tag = size;
      return <Tag style={{ ...headline[size], margin: 0, color: "var(--openui-text-neutral-primary)" }}>{text}</Tag>;
    }
    const style =
      size === "small"
        ? ({
            "--openui-text-body-default": "var(--openui-text-body-sm)",
            "--openui-text-body-default-letter-spacing": "var(--openui-text-body-sm-letter-spacing)",
            color: "var(--openui-text-neutral-secondary)",
          } as CSSProperties)
        : size === "small-heavy"
          ? ({
              "--openui-text-body-default": "var(--openui-text-body-sm-heavy)",
              "--openui-text-body-default-letter-spacing": "var(--openui-text-body-sm-heavy-letter-spacing)",
            } as CSSProperties)
          : undefined;
    return (
      <div style={style}>
        <TextContentWrapper textMarkdown={text} />
      </div>
    );
  },
});
