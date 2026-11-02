import { createParser } from "@openuidev/react-lang";
import { describe, expect, it } from "vitest";
import {
  openuiDashboardAdditionalRules,
  openuiDashboardComponentGroups,
  openuiDashboardExamples,
  openuiDashboardLibrary,
  openuiDashboardPromptOptions,
} from "./index";

const library = openuiDashboardLibrary;
const names = Object.keys(library.components);
const signatures = new Map(
  library
    .prompt()
    .split("\n")
    .filter((line) => /^[A-Z]\w*\(/.test(line))
    .map((line) => [line.slice(0, line.indexOf("(")), line.replace(/\) — .*$/, ")")]),
);

// Reachable only through SmallCard's untyped slots, as its description documents.
const smallCardSlotOnly = ["IconTag", "IconText", "TextBlock", "OverviewCardBlock"];

describe("openuiDashboardLibrary", () => {
  it("keeps the generated prompt stable", () => {
    expect(library.prompt(openuiDashboardPromptOptions)).toMatchSnapshot();
  });

  it("parses every shipped example with no errors", () => {
    const parser = createParser(library.toJSONSchema(), library.root);
    for (const example of openuiDashboardExamples) {
      const { meta } = parser.parse(example);
      expect(meta.errors).toEqual([]);
      expect(meta.unresolved).toEqual([]);
      expect(meta.orphaned).toEqual([]);
    }
  });

  it("puts every component in exactly one group", () => {
    const grouped = openuiDashboardComponentGroups.flatMap((group) => group.components);
    expect([...grouped].sort()).toEqual([...names].sort());
  });

  it("gives every component a typed parent", () => {
    const orphans = names.filter((name) => {
      if (name === library.root) return false;
      const reference = new RegExp(`[(|: ]${name}(\\[\\]|[)|, ])`);
      return ![...signatures].some(
        ([parent, signature]) => parent !== name && reference.test(signature.slice(parent.length)),
      );
    });
    expect(orphans.sort()).toEqual([...smallCardSlotOnly].sort());
  });

  it("names only registered components in the notes and rules", () => {
    const text = [
      ...openuiDashboardComponentGroups.flatMap((group) => group.notes ?? []),
      ...openuiDashboardAdditionalRules,
    ].join("\n");
    // Multi-word PascalCase names such as "MediumCard"; a plural names the same component.
    const mentioned = new Set(
      [...text.matchAll(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g)].map((match) =>
        match[0].replace(/s$/, ""),
      ),
    );
    expect([...mentioned].filter((name) => !names.includes(name))).toEqual([]);
  });

  it("describes every component that has a rule the parser does not check", () => {
    expect(library.components["EntityList"]?.description).toMatch(/size "small"/);
  });
});
