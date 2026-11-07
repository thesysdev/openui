import { createParser } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import type { CardTarget, EditableMessage } from "../index";
import { chatLibrary, chatPromptOptions, parseChatAction, renderCard, streamCard } from "../index";

const parser = createParser(chatLibrary.toJSONSchema(), chatLibrary.root);
const render = (source: string) => renderCard(parser.parse(source), chatLibrary);

const EXAMPLE = `root = Card("Q3 revenue", [summary, stats, table, trend, share, next])
summary = TextContent("Revenue grew **18%**.", "bold")
stats = Fields([Field("Revenue", "$4.2M"), Field("New customers", 312)])
table = Table(["Region", "Revenue"], [["EMEA", "$1.1M"], ["NA", 2900]])
trend = BarChart("Revenue by month", ["Jul", "Aug"], [Series("Self-serve", [820, 905]), Series("Sales", [430])])
share = PieChart("Mix", ["Self-serve", "Sales", "Other"], [60, 40, 0])
next = Actions([Button("By region", @ToAssistant("Break down by region", {quarter: 3}), "primary"), Button("Compare to Q2"), Button("Dashboard", @OpenUrl("https://example.com/d")), Select("Quarter", [SelectItem("Q1"), SelectItem("Q2", "Second")])])`;

describe("renderCard", () => {
  it("maps every component to a Chat SDK card element", () => {
    const { card, errors } = render(EXAMPLE);
    expect(errors).toEqual([]);
    expect(card?.type).toBe("card");
    expect(card?.title).toBe("Q3 revenue");
    expect(card?.children.map((c) => c.type)).toEqual([
      "text",
      "fields",
      "table",
      "chart",
      "chart",
      "actions",
    ]);
    expect(card?.children[0]).toMatchObject({ content: "Revenue grew **18%**.", style: "bold" });
    expect(card?.children[1]).toMatchObject({
      children: [
        { type: "field", label: "Revenue", value: "$4.2M" },
        { type: "field", label: "New customers", value: "312" },
      ],
    });
    expect(card?.children[2]).toMatchObject({
      headers: ["Region", "Revenue"],
      rows: [
        ["EMEA", "$1.1M"],
        ["NA", "2900"],
      ],
    });
  });

  it("gives every series one point per label and drops empty pie slices", () => {
    const { card } = render(EXAMPLE);
    expect(card?.children[3]).toMatchObject({
      title: "Revenue by month",
      chart: {
        type: "bar",
        categories: ["Jul", "Aug"],
        series: [
          {
            name: "Self-serve",
            data: [
              { label: "Jul", value: 820 },
              { label: "Aug", value: 905 },
            ],
          },
          {
            name: "Sales",
            data: [
              { label: "Jul", value: 430 },
              { label: "Aug", value: 0 },
            ],
          },
        ],
      },
    });
    expect(card?.children[4]).toMatchObject({
      chart: { type: "pie", segments: [{ label: "Self-serve" }, { label: "Sales" }] },
    });
  });

  it("encodes button actions so the click round-trips to an OpenUI action", () => {
    const { card } = render(EXAMPLE);
    const actions = card?.children[5];
    if (actions?.type !== "actions") throw new Error("expected actions");
    const [toAssistant, labelOnly, link, select] = actions.children;

    expect(link).toEqual({ type: "link-button", label: "Dashboard", url: "https://example.com/d" });
    expect(toAssistant).toMatchObject({ type: "button", label: "By region", style: "primary" });

    const ids = actions.children.map((c) => ("id" in c ? c.id : undefined)).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);

    const click = (el: typeof toAssistant) =>
      parseChatAction({
        actionId: (el as { id: string }).id,
        value: (el as { value?: string }).value,
      });
    expect(click(toAssistant)).toEqual({
      type: "continue_conversation",
      params: { context: { quarter: 3 } },
      humanFriendlyMessage: "Break down by region",
    });
    expect(click(labelOnly)).toEqual({
      type: "continue_conversation",
      params: {},
      humanFriendlyMessage: "Compare to Q2",
    });

    expect(select).toMatchObject({
      type: "select",
      label: "Quarter",
      options: [
        { value: "Q1", label: "Q1" },
        { value: "Q2", label: "Second" },
      ],
    });
    expect(parseChatAction({ actionId: (select as { id: string }).id, value: "Q2" })).toEqual({
      type: "continue_conversation",
      params: { label: "Quarter", value: "Q2" },
      humanFriendlyMessage: "Quarter: Q2",
    });
  });

  it("ignores actions from other cards", () => {
    expect(parseChatAction({ actionId: "approve", value: "x" })).toBeNull();
    expect(parseChatAction({ actionId: "openui:b:0", value: "not json" })).toBeNull();
  });

  it("caps button values at Slack's 2000 characters", () => {
    const long = "x".repeat(3000);
    const { card } = render(
      `root = Card("T", [Actions([Button("Go", @ToAssistant("${long}", {big: "${long}"}))])])`,
    );
    const actions = card?.children[0];
    if (actions?.type !== "actions") throw new Error("expected actions");
    const value = (actions.children[0] as { value: string }).value;
    expect(value.length).toBeLessThanOrEqual(2000);
    expect(JSON.parse(value).p).toBeUndefined();
  });

  it("groups loose buttons and fields and wraps a non-Card root", () => {
    const { card } = render(`root = Section([TextContent("hi"), Divider()])`);
    expect(card).toMatchObject({ type: "card", children: [{ type: "section" }] });
  });

  it("resolves $variables to their defaults", () => {
    const { card } = render(`$name = "Ada"\nroot = Card("Hi", [TextContent("Hello " + $name)])`);
    expect(card?.children[0]).toMatchObject({ content: "Hello Ada" });
  });

  it("skips unfinished charts and buttons while streaming", () => {
    const { card } = render(`root = Card("Live", [TextContent("Streaming te`);
    expect(card?.children).toEqual([{ type: "text", content: "Streaming te" }]);
    const partialChart = render(`root = Card("Live", [BarChart("Rev", ["A", "B"], [Series("x", [1`);
    expect(partialChart.card?.children).toEqual([]);
  });

  it("returns null without a root", () => {
    expect(render("").card).toBeNull();
  });
});

describe("chatPromptOptions", () => {
  it("documents every component and leaves out state and tools", () => {
    const prompt = chatLibrary.prompt(chatPromptOptions);
    for (const name of Object.keys(chatLibrary.components)) expect(prompt).toContain(`${name}(`);
    expect(prompt).not.toContain("Query(");
  });
});

describe("streamCard", () => {
  function target() {
    const posts: unknown[] = [];
    const edits: unknown[] = [];
    const message: EditableMessage = {
      edit: async (m) => {
        edits.push(m);
      },
    };
    const t: CardTarget = {
      post: async (m) => {
        posts.push(m);
        return message;
      },
    };
    return { t, posts, edits };
  }

  async function* chunks(text: string, size = 7) {
    for (let i = 0; i < text.length; i += size) yield text.slice(i, i + size);
  }

  it("posts once, edits as it streams and ends on the full card", async () => {
    const { t, posts, edits } = target();
    const result = await streamCard(t, chunks(EXAMPLE), { updateIntervalMs: 0 });
    expect(posts).toHaveLength(1);
    expect(edits.length).toBeGreaterThan(0);
    expect(edits.at(-1)).toEqual(result.card);
    expect(result.card?.children).toHaveLength(6);
    expect(result.text).toBe(EXAMPLE);
  });

  it("posts the text when the model writes no UI", async () => {
    const { t, posts } = target();
    const result = await streamCard(t, chunks("Sorry, I can't help with that."));
    expect(result.card).toBeNull();
    expect(posts).toEqual(["Sorry, I can't help with that."]);
  });
});
