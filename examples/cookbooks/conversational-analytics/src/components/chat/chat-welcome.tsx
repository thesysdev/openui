import type { ReactNode } from "react";
import { Mascot } from "../mascot";
import "./chat.css";

/*
 * ChatWelcome: the empty state. The mascot, a hero-italic title and one line
 * on what you can ask. Bare: no card, no glow, nothing moves.
 */

export type ChatWelcomeProps = {
  /** Hero title. Wrap a word in <em> to paint it red. */
  title?: ReactNode;
  description?: ReactNode;
  mascot?: boolean;
};

export function ChatWelcome({
  title = (
    <>
      OpenUI <em>×</em> F1
    </>
  ),
  description = "Ask about recorded lap times from the 2024 Miami Grand Prix, provided by OpenF1. Follow up to explore a different angle.",
  mascot = true,
}: ChatWelcomeProps) {
  return (
    <section className="f1c f1c-welcome">
      {mascot && <Mascot size={88} alt="" />}
      <h1 className="f1c-hero">{title}</h1>
      <p className="f1c-welcome__lede">{description}</p>
    </section>
  );
}
