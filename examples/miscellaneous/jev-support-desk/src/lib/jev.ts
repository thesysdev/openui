import type { Screen } from "./screens";
import { itemsOf } from "./store";

// Jev compiles each new question set on first use (seconds, measured up to 47 s),
// so the questions never change: descriptions go in `state` and options are
// numbered slots.
const SCREEN_SLOTS = 12;
const ITEM_SLOTS = 8;
const slots = (prefix: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);

const QUESTIONS = {
  screen: {
    type: "choice",
    instructions: `State fields screen1..screen${SCREEN_SLOTS} describe saved screens (empty = unused). Which one does exactly the task in customer_request? A return screen does not do an exchange, tracking or an address change. Pick none if no screen does the task.`,
    criteria: {
      ...Object.fromEntries(
        slots("screen", SCREEN_SLOTS).map((k) => [
          k,
          `The screen in state field ${k} does the task.`,
        ]),
      ),
      none: "No saved screen does the task.",
    },
  },
  item: {
    type: "choice",
    instructions: `State fields item1..item${ITEM_SLOTS} list the customer's purchases (empty = unused). Which one is customer_request about? Pick none if it is not about one purchase.`,
    criteria: {
      ...Object.fromEntries(
        slots("item", ITEM_SLOTS).map((k) => [
          k,
          `The request is about the purchase in state field ${k}.`,
        ]),
      ),
      none: "Not about one purchase.",
    },
  },
};

export interface Choice {
  id: string | null;
  label: string;
  p: number;
}

export interface Decision {
  ms: number;
  screen: Choice;
  item: Choice;
}

type Answer = { choice: string; probabilities: Record<string, number> };

export async function decide(
  request: string,
  customerId: string,
  screens: Screen[],
): Promise<Decision> {
  const recent = screens.slice(-SCREEN_SLOTS);
  const items = itemsOf(customerId).slice(0, ITEM_SLOTS);
  const state: Record<string, string> = { customer_request: request };
  slots("screen", SCREEN_SLOTS).forEach((k, i) => (state[k] = recent[i]?.description ?? ""));
  slots("item", ITEM_SLOTS).forEach(
    (k, i) => (state[k] = items[i] ? `${items[i].item.name} (${items[i].order.status})` : ""),
  );

  const started = performance.now();
  const res = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "jev-latest", state, questions: QUESTIONS }),
  });
  if (!res.ok) throw new Error(`Jev ${res.status}: ${await res.text()}`);
  const { answers } = (await res.json()) as { answers: Record<string, Answer> };
  const ms = Math.round(performance.now() - started);

  // Slot keys ("screen3", "item2") map back by position; "none" has no digits.
  const pick = (a: Answer, entries: { id: string; label: string }[]): Choice => {
    const entry = entries[Number(a.choice.replace(/\D/g, "")) - 1];
    return {
      id: entry?.id ?? null,
      label: entry?.label ?? "none",
      p: a.probabilities[a.choice] ?? 0,
    };
  };

  return {
    ms,
    screen: pick(
      answers.screen,
      recent.map((s) => ({ id: s.id, label: s.title })),
    ),
    item: pick(
      answers.item,
      items.map((x) => ({ id: x.item.id, label: x.item.name })),
    ),
  };
}
