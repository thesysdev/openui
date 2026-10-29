"use client";

import { defineComponent } from "@openuidev/react-lang";
import { useState } from "react";
import { inline } from "../markdownBlocks";
import { renderSlot } from "../slot";
import { cx, str } from "../style";
import { FlashcardSchema } from "./schema";

export * from "./schema";

export const Flashcard = defineComponent({
  name: "Flashcard",
  props: FlashcardSchema,
  description: "Card that flips between front and back when tapped. Put several in a Carousel or Grid.",
  component: function FlashcardView({ props, renderNode }) {
    const [flipped, setFlipped] = useState(false);
    const face = (value: unknown) => (typeof value === "string" ? <span className="iui-flashcard-word">{inline(value)}</span> : renderSlot(value, renderNode));
    return (
      <button type="button" className={cx("iui-flashcard", flipped && "is-flipped")} aria-pressed={flipped} onClick={() => setFlipped(!flipped)}>
        <span className="iui-flashcard-inner">
          <span className="iui-flashcard-face is-front" aria-hidden={flipped}>
            {face(props.front)}
            <span className="iui-flashcard-hint">{str(props.hint) || "Tap to flip"}</span>
          </span>
          <span className="iui-flashcard-face is-back" aria-hidden={!flipped}>
            {face(props.back)}
          </span>
        </span>
      </button>
    );
  },
});
