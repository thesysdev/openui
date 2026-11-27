import { describe, expect, it } from "vitest";
import { toMarkdown } from "../markdown";
import { parse } from "../parser";
import type { ElementNode, ParamMap } from "../types";

// ── Test schema ─────────────────────────────────────────────────────────────
// A subset of the default OpenUI component library, plus one custom component.

const p = (...names: string[]) => ({
  params: names.map((name) => ({ name: name.replace("?", ""), required: !name.endsWith("?") })),
});

const schema: ParamMap = new Map([
  ["Stack", p("children", "direction?", "gap?")],
  ["Card", p("children", "variant?")],
  ["CardHeader", p("title?", "subtitle?")],
  ["Heading", p("text", "level?")],
  ["TextContent", p("text", "size?")],
  ["MarkDownRenderer", p("textMarkdown", "variant?")],
  ["CodeBlock", p("language", "codeString")],
  ["Callout", p("variant", "title", "description")],
  ["Separator", p("orientation?")],
  ["Image", p("alt", "src?")],
  ["Table", p("columns")],
  ["Col", p("label", "data", "type?")],
  ["ListBlock", p("items", "variant?")],
  ["ListItem", p("title", "subtitle?")],
  ["Steps", p("items")],
  ["StepsItem", p("title", "details")],
  ["Tabs", p("items")],
  ["TabItem", p("value", "trigger", "content")],
  ["Accordion", p("items")],
  ["AccordionItem", p("value", "trigger", "content")],
  ["TagBlock", p("tags")],
  ["BarChart", p("labels", "series", "variant?", "xLabel?")],
  ["Series", p("category", "values")],
  ["PieChart", p("labels", "values")],
  ["Buttons", p("buttons", "direction?")],
  ["Button", p("label", "action?", "variant?")],
  ["FollowUpBlock", p("items")],
  ["FollowUpItem", p("text")],
  ["Form", p("name", "buttons", "fields")],
  ["FormControl", p("label", "input", "hint?")],
  ["Input", p("name", "placeholder?", "type?", "rules?", "value?")],
  ["Select", p("name", "items", "placeholder?", "rules?", "value?")],
  ["SelectItem", p("value", "label")],
  ["CheckBoxGroup", p("name", "items", "rules?", "value?")],
  ["CheckBoxItem", p("label", "description", "name", "defaultChecked?")],
  ["ProductTile", p("title", "blurb", "price?", "variant?")],
]);

const md = (source: string) => toMarkdown(parse(source, schema, "Stack"));

const el = (typeName: string, props: Record<string, unknown>): ElementNode => ({
  type: "element",
  typeName,
  props,
  partial: false,
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe("toMarkdown", () => {
  describe("input handling", () => {
    it("returns an empty string for null, undefined and empty parse results", () => {
      expect(toMarkdown(null)).toBe("");
      expect(toMarkdown(undefined)).toBe("");
      expect(toMarkdown(parse("", schema))).toBe("");
    });

    it("accepts a ParseResult or a bare ElementNode", () => {
      const result = parse('root = Stack([t])\nt = TextContent("Hello")', schema);
      expect(toMarkdown(result)).toBe("Hello");
      expect(toMarkdown(result.root)).toBe("Hello");
    });

    it("renders whatever has arrived in a partial (streaming) result", () => {
      const result = parse(
        'root = Stack([a, b])\na = TextContent("First")\nb = TextContent("Sec',
        schema,
      );
      expect(result.meta.incomplete).toBe(true);
      expect(toMarkdown(result)).toBe("First\n\nSec");
    });
  });

  describe("text and layout", () => {
    it("flattens layout containers and separates blocks with blank lines", () => {
      const out = md(`root = Stack([card], "column", "m")
card = Card([header, body, more], "sunk")
header = CardHeader("Quarterly report", "Q3 2026")
body = TextContent("Revenue grew 12%.", "large")
more = MarkDownRenderer("Details in **bold**.")`);
      expect(out).toBe(
        "## Quarterly report\n\nQ3 2026\n\nRevenue grew 12%.\n\nDetails in **bold**.",
      );
    });

    it("never prints presentational props such as variant, size or direction", () => {
      const out = md('root = Stack([t], "row", "xl")\nt = TextContent("Only this", "large-heavy")');
      expect(out).toBe("Only this");
    });

    it("renders InlineHeader as a level-3 heading with its description", () => {
      const out = toMarkdown(el("InlineHeader", { heading: "Details", description: "Fine print" }));
      expect(out).toBe("### Details\n\nFine print");
    });

    it("renders Heading with its level, defaulting to level 2", () => {
      expect(md('root = Stack([h])\nh = Heading("Title", 1)')).toBe("# Title");
      expect(md('root = Stack([h])\nh = Heading("Title")')).toBe("## Title");
      expect(md('root = Stack([h])\nh = Heading("Title", 9)')).toBe("## Title");
    });

    it("renders CodeBlock as a fenced block with the language", () => {
      const out = md('root = Stack([c])\nc = CodeBlock("ts", "const a = 1;\\nconst b = 2;")');
      expect(out).toBe("```ts\nconst a = 1;\nconst b = 2;\n```");
    });

    it("uses a longer fence when the code itself contains a fence", () => {
      const out = md('root = Stack([c])\nc = CodeBlock("md", "```js\\nx\\n```")');
      expect(out).toBe("````md\n```js\nx\n```\n````");
    });

    it("renders Callout as a blockquote", () => {
      const out = md(
        'root = Stack([c])\nc = Callout("warning", "Heads up", "Prices change daily.")',
      );
      expect(out).toBe("> **Heads up**\n>\n> Prices change daily.");
    });

    it("renders Separator and Image", () => {
      const out = md(`root = Stack([a, s, i, j])
a = TextContent("Above")
s = Separator()
i = Image("A red bike", "https://example.com/bike.png")
j = Image("No source")`);
      expect(out).toBe("Above\n\n---\n\n![A red bike](https://example.com/bike.png)\n\nNo source");
    });
  });

  describe("lists and tables", () => {
    it("renders Table columns as a GFM table and escapes pipes", () => {
      const out = md(`root = Stack([t])
t = Table([Col("Name", ["Ada", "Linus"]), Col("Score", [97, 88]), Col("Note", ["a|b"])])`);
      expect(out).toBe(
        [
          "| Name | Score | Note |",
          "| --- | --- | --- |",
          "| Ada | 97 | a\\|b |",
          "| Linus | 88 |   |",
        ].join("\n"),
      );
    });

    it("renders component cells in a table as inline text", () => {
      const out = md(`root = Stack([t])
t = Table([Col("Item", [TextContent("Line one\\nline two")])])`);
      expect(out).toBe("| Item |\n| --- |\n| Line one line two |");
    });

    it("renders ListBlock as a bullet list, or numbered with the number variant", () => {
      expect(
        md(`root = Stack([l])
l = ListBlock([ListItem("Milk", "2 litres"), ListItem("Bread")])`),
      ).toBe("- **Milk** — 2 litres\n- Bread");
      expect(
        md(`root = Stack([l])
l = ListBlock([ListItem("First"), ListItem("Second")], "number")`),
      ).toBe("1. First\n2. Second");
    });

    it("renders Steps as a numbered list with indented details", () => {
      const out = md(`root = Stack([s])
s = Steps([StepsItem("Install", "Run pnpm install."), StepsItem("Build", "Run pnpm build.")])`);
      expect(out).toBe(
        "1. **Install**\n\n   Run pnpm install.\n2. **Build**\n\n   Run pnpm build.",
      );
    });

    it("renders TagBlock as comma-separated text", () => {
      expect(md('root = Stack([t])\nt = TagBlock(["fast", "cheap", "good"])')).toBe(
        "fast, cheap, good",
      );
    });

    it("renders Tabs and Accordion items as sections with their trigger as heading", () => {
      const out = md(`root = Stack([tabs, acc])
tabs = Tabs([TabItem("a", "Overview", [TextContent("All good.")])])
acc = Accordion([AccordionItem("b", "FAQ", [TextContent("Ask away.")])])`);
      expect(out).toBe("### Overview\n\nAll good.\n\n### FAQ\n\nAsk away.");
    });
  });

  describe("charts", () => {
    it("renders a labels + series chart as a data table", () => {
      const out = md(`root = Stack([c])
c = BarChart(["Jan", "Feb"], [Series("Sales", [10, 20]), Series("Costs", [5, 8])], "grouped", "Month")`);
      expect(out).toBe(
        "| Month | Sales | Costs |\n| --- | --- | --- |\n| Jan | 10 | 5 |\n| Feb | 20 | 8 |",
      );
    });

    it("renders a labels + values chart as a two-column table", () => {
      const out = md('root = Stack([c])\nc = PieChart(["Yes", "No"], [70, 30])');
      expect(out).toBe("| Label | Value |\n| --- | --- |\n| Yes | 70 |\n| No | 30 |");
    });
  });

  describe("interactive components", () => {
    it("drops buttons and follow-up suggestions", () => {
      const out = md(`root = Stack([t, b, f])
t = TextContent("Pick one")
b = Buttons([Button("Yes"), Button("No")])
f = FollowUpBlock([FollowUpItem("Tell me more")])`);
      expect(out).toBe("Pick one");
    });

    it("renders form fields as label/value pairs and drops the buttons", () => {
      const out = md(`root = Stack([form])
$email = "ada@example.com"
form = Form("signup", Buttons([Button("Submit")]), [email, plan, extras, empty])
email = FormControl("Email", Input("email", "you@example.com", "email", {}, $email))
plan = FormControl("Plan", Select("plan", [SelectItem("pro", "Pro plan"), SelectItem("free", "Free")], null, {}, "pro"))
extras = FormControl("Extras", CheckBoxGroup("extras", [CheckBoxItem("Newsletter", "", "news", true), CheckBoxItem("SMS", "", "sms")]))
empty = FormControl("Notes", Input("notes"))`);
      expect(out).toBe(
        [
          "- **Email:** ada@example.com",
          "- **Plan:** Pro plan",
          "- **Extras:** Newsletter",
          "- **Notes**",
        ].join("\n"),
      );
    });

    it("maps a checkbox value record to the checked item labels", () => {
      const out = toMarkdown(
        el("FormControl", {
          label: "Extras",
          input: el("CheckBoxGroup", {
            name: "extras",
            items: [
              el("CheckBoxItem", { label: "Newsletter", name: "news" }),
              el("CheckBoxItem", { label: "SMS", name: "sms" }),
            ],
            value: { news: false, sms: true },
          }),
        }),
      );
      expect(out).toBe("**Extras:** SMS");
    });
  });

  describe("dynamic values", () => {
    it("resolves $state references from the parse result", () => {
      const out = md('$name = "Ada"\nroot = Stack([t])\nt = TextContent($name)');
      expect(out).toBe("Ada");
    });

    it("lets options.stateDeclarations override the declared defaults", () => {
      const result = parse('$name = "Ada"\nroot = Stack([t])\nt = TextContent($name)', schema);
      expect(toMarkdown(result, { stateDeclarations: { $name: "Grace" } })).toBe("Grace");
    });

    it("skips values that only exist at runtime", () => {
      const out = md(`root = Stack([a, b])
a = TextContent("Static")
b = TextContent($flag ? "yes" : "no")`);
      expect(out).toBe("Static");
    });
  });

  describe("unknown components", () => {
    it("prints text props in order, bolding title and skipping numbers and presentational props", () => {
      const out = md(
        'root = Stack([t])\nt = ProductTile("Trail shoe", "Light and grippy.", 129, "card")',
      );
      expect(out).toBe("**Trail shoe**\n\nLight and grippy.");
    });

    it("recurses into element children of unknown components", () => {
      const out = toMarkdown(
        el("Section", {
          title: "Team",
          children: [el("TextContent", { text: "Ada" }), el("TextContent", { text: "Linus" })],
        }),
      );
      expect(out).toBe("**Team**\n\nAda\n\nLinus");
    });

    it("falls back to the generic renderer when a known name has a different shape", () => {
      // A custom library's `Text` with no `text` prop still shows its content
      expect(toMarkdown(el("Text", { value: "Hello from a custom Text" }))).toBe(
        "Hello from a custom Text",
      );
      expect(toMarkdown(el("Table", { caption: "Custom table" }))).toBe("Custom table");
    });

    it("does not loop on a self-referencing tree", () => {
      const node = el("Section", { title: "Loop" });
      node.props.children = [node];
      expect(toMarkdown(node)).toBe("**Loop**");
    });

    it("renders an array of plain strings as a bullet list", () => {
      const out = toMarkdown(el("Highlights", { points: ["Fast", "Small"] }));
      expect(out).toBe("- Fast\n- Small");
    });
  });

  describe("options.components", () => {
    it("overrides a built-in renderer", () => {
      const result = parse('root = Stack([h])\nh = CardHeader("Report")', schema);
      const out = toMarkdown(result, {
        components: { CardHeader: (node, ctx) => `# ${ctx.inline(node.props.title)}` },
      });
      expect(out).toBe("# Report");
    });

    it("can bring back a dropped interactive component", () => {
      const result = parse('root = Stack([b])\nb = Buttons([Button("Buy now")])', schema);
      const out = toMarkdown(result, {
        components: {
          Buttons: (node, ctx) => ctx.render(node.props.buttons),
          Button: (node, ctx) => `[${ctx.inline(node.props.label)}]`,
        },
      });
      expect(out).toBe("[Buy now]");
    });

    it("drops a component with false and falls back with undefined", () => {
      const result = parse(
        'root = Stack([a, b])\na = TextContent("Keep")\nb = CardHeader("Gone")',
        schema,
      );
      expect(toMarkdown(result, { components: { CardHeader: false } })).toBe("Keep");
      expect(toMarkdown(result, { components: { TextContent: () => undefined } })).toBe(
        "Keep\n\n## Gone",
      );
    });
  });
});
