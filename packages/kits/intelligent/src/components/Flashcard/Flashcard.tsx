"use client";

import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { inline } from "../Markdown/markdownBlocks";
import { flashcardStyles, names } from "./flashcard.styles";

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
  const face = (value: ReactNode) => (typeof value === "string" ? <span className={clsx(flashcardStyles.word, names.word)}>{inline(value)}</span> : value);
  return (
    <button type="button" className={clsx(flashcardStyles.root, names.root)} aria-pressed={flipped} onClick={() => setFlipped(!flipped)}>
      <span className={clsx(flashcardStyles.inner, names.inner)}>
        <span className={clsx(flashcardStyles.face, names.face, names.side.front)} aria-hidden={flipped}>
          {face(front)}
          <span className={clsx(flashcardStyles.hint, names.hint)}>{hint || "Tap to flip"}</span>
        </span>
        <span className={clsx(flashcardStyles.face, names.face, flashcardStyles.back, names.side.back)} aria-hidden={!flipped}>
          {face(back)}
        </span>
      </span>
    </button>
  );
}
