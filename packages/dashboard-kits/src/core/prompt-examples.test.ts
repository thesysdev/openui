import type { LibrarySpec } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { analyticsKit } from "../kits/analytics/kit";
import { ecommerceKit } from "../kits/ecommerce/kit";
import type { KitDefinition } from "./kit";
import { buildSystemPrompt, PROMPT_BUDGET, rankGallery } from "./prompt";

const KITS = [ecommerceKit, analyticsKit];

// The library specs `npm run generate` writes in the example app; the prompt
// size checks need the real ones, and are skipped until they exist.
const SPECS: Record<string, LibrarySpec> = {};
try {
  for (const kit of KITS) {
    SPECS[kit.id] = (
      await import(
        `../../../../examples/miscellaneous/dashboard-kits/src/generated/${kit.id}.spec.json`
      )
    ).default;
  }
} catch {
  // Not generated yet.
}
const haveSpecs = KITS.every((kit) => SPECS[kit.id]);
const specOf = (kit: KitDefinition) => SPECS[kit.id]!;
const examplesIn = (kit: KitDefinition, prompt: string) =>
  kit.gallery.filter((d) => prompt.includes(d.program)).map((d) => d.title);

describe("rankGallery", () => {
  const top = (kit: KitDefinition, question: string) => rankGallery(kit, question)[0]?.dashboard;

  it("ranks the dashboard that answers the question first", () => {
    expect(top(ecommerceKit, "Which products need restocking?")?.title).toBe(
      "Merchandising and checkout",
    );
    expect(top(analyticsKit, "Which experiments are ready to decide?")?.title).toBe(
      "Features and experiments",
    );
    expect(
      top(ecommerceKit, "Is our ad spend paying back? Compare channels against the ROAS target.")
        ?.title,
    ).toBe("Marketing and profit");
    expect(top(analyticsKit, "How are free workspaces converting to paid?")?.title).toBe(
      "Monetisation",
    );
  });

  it("matches forms of a word and ignores filler", () => {
    expect(top(ecommerceKit, "restock")?.title).toBe(top(ecommerceKit, "restocking")?.title);
    expect(rankGallery(ecommerceKit, "what is the")).toEqual([]);
    expect(rankGallery(ecommerceKit, "which experiments are ready to decide")).toEqual([]);
  });
});

describe.skipIf(!haveSpecs)("buildSystemPrompt with a question", () => {
  it("is unchanged without a question", () => {
    for (const kit of KITS) {
      const spec = specOf(kit);
      const today = buildSystemPrompt(kit, spec);
      expect(buildSystemPrompt(kit, spec, {})).toBe(today);
      expect(buildSystemPrompt(kit, spec, { question: "  " })).toBe(today);
      // Nothing in the gallery matches: the default examples.
      expect(buildSystemPrompt(kit, spec, { question: "hello there" })).toBe(today);
    }
  });

  it("carries the most relevant dashboards, examples or not", () => {
    const restock = buildSystemPrompt(ecommerceKit, specOf(ecommerceKit), {
      question: "Which products need restocking?",
    });
    expect(examplesIn(ecommerceKit, restock)).toContain("Merchandising and checkout");
    const experiments = buildSystemPrompt(analyticsKit, specOf(analyticsKit), {
      question: "Which experiments are ready to decide?",
    });
    expect(examplesIn(analyticsKit, experiments)).toContain("Features and experiments");
    // The only gallery program with the Tracker of shipping on time.
    const shipping = buildSystemPrompt(ecommerceKit, specOf(ecommerceKit), {
      question: "Are we shipping orders on time, and which products get returned most?",
    });
    expect(examplesIn(ecommerceKit, shipping)).toContain("Merchandising and checkout");
  });

  it("keeps every starter's prompt within the budget, with 1 to 3 examples", () => {
    for (const kit of KITS) {
      const spec = specOf(kit);
      for (const question of kit.starters) {
        const prompt = buildSystemPrompt(kit, spec, { question });
        expect(prompt.length, `${kit.id}: ${question}`).toBeLessThanOrEqual(PROMPT_BUDGET);
        const count = examplesIn(kit, prompt).length;
        expect(count, `${kit.id}: ${question}`).toBeGreaterThanOrEqual(1);
        expect(count, `${kit.id}: ${question}`).toBeLessThanOrEqual(3);
      }
    }
  });

  it("adds examples only while they fit a tighter budget", () => {
    const spec = specOf(ecommerceKit);
    const question = "Is our ad spend paying back? Compare channels against the ROAS target.";
    const full = buildSystemPrompt(ecommerceKit, spec, { question });
    const budget = full.length - 1;
    const tighter = buildSystemPrompt(ecommerceKit, spec, { question, budget });
    expect(tighter.length).toBeLessThanOrEqual(budget);
    expect(examplesIn(ecommerceKit, tighter).length).toBeGreaterThanOrEqual(1);
    // No example fits at all: the defaults rather than none.
    expect(buildSystemPrompt(ecommerceKit, spec, { question, budget: 1000 })).toBe(
      buildSystemPrompt(ecommerceKit, spec),
    );
  });
});
