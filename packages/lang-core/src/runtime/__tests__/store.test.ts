import { describe, expect, it } from "vitest";
import { createParser, createStreamingParser } from "../../parser";
import type { LibraryJSONSchema } from "../../parser/types";
import { createStore } from "../store";

// From an end-to-end chat run (issue #767): a long $ingredients list and a `@Each($dishes` tail.
const PROGRAM = `root = Col([shopping, copyButton, dinnerCards], 4)
$ingredients = ["500 g (about 1 lb) ground beef", "12 small tortillas or taco shells", "1 packet taco seasoning (about 28 g / 1 oz)", "1 small head lettuce", "2 medium tomatoes", "1 small onion", "150 g (about 1½ cups) shredded cheddar", "2 avocados", "200 g (about ¾ cup) salsa", "150 g (about ⅔ cup) sour cream", "2 limes"]
$checked = []
$dishes = [{name: "Lemon chicken pasta", time: "30 minutes"}, {name: "Chickpea and spinach curry", time: "35 minutes"}]
shopping = Card([Col(@Each($ingredients, "item", Pressable([Text(item)], @Set($checked, @Toggle($checked, item)), @Includes($checked, item))))])
copyButton = Button("Copy whole shopping list", @CopyToClipboard(@Join($ingredients, "\\n")))
dinnerCards = Grid(@Each($dishes, "dish", Card([Title(dish.name), Button("Get recipe", @ToAssistant("Recipe for " + dish.name, {dishName: dish.name}))])))
`;

const schema = {} as LibraryJSONSchema;

/** Streams PROGRAM in 20-character steps, applying each parse to the store the way the renderers do. */
function streamInto(store: ReturnType<typeof createStore>, onStep?: (text: string) => void) {
  const sp = createStreamingParser(schema, "Col");
  for (let end = 20; end < PROGRAM.length + 20; end += 20) {
    const text = PROGRAM.slice(0, end);
    store.initialize(sp.set(text).stateDeclarations, {});
    onStep?.(text);
  }
}

describe("store defaults while streaming", () => {
  it("ends with the batch-parse state: full values, no half-typed names", () => {
    const store = createStore();
    streamInto(store);
    const batch = createParser(schema, "Col").parse(PROGRAM).stateDeclarations;
    expect(store.getSnapshot()).toEqual(batch);
    expect(store.get("$ingredients")).toHaveLength(11);
    expect(Object.keys(store.getSnapshot()).sort()).toEqual([
      "$checked",
      "$dishes",
      "$ingredients",
    ]);
  });

  it("keeps a value the user set mid-stream", () => {
    const store = createStore();
    streamInto(store, (text) => {
      if (text.includes("$checked = []\n") && !store.get("$checked")?.length) {
        store.set("$checked", ["2 limes"]);
      }
    });
    expect(store.get("$checked")).toEqual(["2 limes"]);
    expect(store.get("$ingredients")).toHaveLength(11);
  });

  it("a value restored with pristine: true (@Reset) can still be replaced", () => {
    const store = createStore();
    store.initialize({ $title: "Quarterly rev" }, {});
    store.set("$title", "user edit");
    store.set("$title", "Quarterly rev", { pristine: true });
    store.initialize({ $title: "Quarterly revenue" }, {});
    expect(store.get("$title")).toBe("Quarterly revenue");
  });
});
