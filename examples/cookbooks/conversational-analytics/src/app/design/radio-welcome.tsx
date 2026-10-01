"use client";

import { ChatStarters, ChatWelcome, type ChatStarter } from "../../components/chat";

/*
 * RadioWelcome: the empty state for a new chat. The welcome and the starting grid,
 * set above the Radio bar. Both settle in once on load; nothing moves after that.
 * Picking a starter radios it in, and the thread takes over from the first send.
 */

// Asked as written, so the question reads the same in the thread as on the grid.
const starters: ChatStarter[] = [
  "Who won the last race?",
  "How does the drivers' championship look?",
  "Compare Norris and Piastri's lap times in Baku",
].map((q) => ({ displayText: q, prompt: q }));

export function RadioWelcome({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="radio-welcome" style={{ display: "grid", gap: 40 }}>
      <style>{`
        .radio-welcome > * { animation: radio-welcome-in 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .radio-welcome > :nth-child(3) { animation-delay: 90ms; }
        @keyframes radio-welcome-in { from { opacity: 0; transform: translateY(8px); } }
        @media (prefers-reduced-motion: reduce) { .radio-welcome > * { animation: none; } }
      `}</style>
      <ChatWelcome description="Ask about any race, driver or team this season, live from OpenF1. Follow up to explore a different angle." />
      <ChatStarters starters={starters} onPick={onPick} />
    </div>
  );
}
