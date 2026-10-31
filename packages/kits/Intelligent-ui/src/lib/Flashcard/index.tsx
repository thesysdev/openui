"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Flashcard as FlashcardView } from "../../components/Flashcard";
import { str } from "../../shared/style";
import { renderSlot, type Render } from "../helpers";
import { FlashcardSchema } from "./schema";

export * from "./schema";

// A string face is the card's word, drawn large; anything else renders as it is.
const face = (value: unknown, renderNode: Render) => (typeof value === "string" ? value : renderSlot(value, renderNode));

export const Flashcard = defineComponent({
  name: "Flashcard",
  props: FlashcardSchema,
  description: "Card that flips between front and back when tapped. Put several in a Carousel or Grid.",
  component: ({ props, renderNode }) => (
    <FlashcardView front={face(props.front, renderNode)} back={face(props.back, renderNode)} hint={str(props.hint)} />
  ),
});
