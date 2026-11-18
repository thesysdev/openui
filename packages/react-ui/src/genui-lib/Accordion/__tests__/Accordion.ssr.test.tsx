import { Renderer } from "@openuidev/react-lang";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { openuiLibrary } from "../../openuiLibrary";

// Regression test: a fully static response must open the FIRST section, not
// the last. The auto-open branch treated the baseline render (0 -> N items)
// as streaming growth and opened items[items.length - 1].
// See https://github.com/thesysdev/openui/issues/861

const STATIC_PROGRAM = `root = Accordion([i1, i2, i3])
i1 = AccordionItem("a", "Apple", [c1])
i2 = AccordionItem("b", "Banana", [c2])
i3 = AccordionItem("c", "Cherry", [c3])
c1 = TextContent("Apple section content")
c2 = TextContent("Banana section content")
c3 = TextContent("Cherry section content")`;

describe("Accordion initial open state", () => {
  it("opens the first section on a static mount", () => {
    const html = renderToString(<Renderer response={STATIC_PROGRAM} library={openuiLibrary} />);

    const expandedStates = [...html.matchAll(/aria-expanded="(true|false)"/g)].map((m) => m[1]);
    expect(expandedStates).toEqual(["true", "false", "false"]);

    expect(html).toContain("Apple section content");
    expect(html).not.toContain("Cherry section content");
  });
});
