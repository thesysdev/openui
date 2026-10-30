"use client";

import { useState, type ReactNode } from "react";
import { cx } from "../../shared/style";
import { inline } from "../Markdown/markdownBlocks";

export interface FlashcardProps {
  /** A word or phrase (in large type, with **bold** and the like), or any content. */
  front: ReactNode;
  back: ReactNode;
  /** Under the front (default "Tap to flip"). */
  hint?: string;
}

/** A card that flips between front and back when tapped. */
export function Flashcard({ front, back, hint }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  const face = (value: ReactNode) => (typeof value === "string" ? <span className="iui-flashcard-word">{inline(value)}</span> : value);
  return (
    <button type="button" className={cx("iui-flashcard", flipped && "is-flipped")} aria-pressed={flipped} onClick={() => setFlipped(!flipped)}>
      <span className="iui-flashcard-inner">
        <span className="iui-flashcard-face is-front" aria-hidden={flipped}>
          {face(front)}
          <span className="iui-flashcard-hint">{hint || "Tap to flip"}</span>
        </span>
        <span className="iui-flashcard-face is-back" aria-hidden={!flipped}>
          {face(back)}
        </span>
      </span>
    </button>
  );
}
