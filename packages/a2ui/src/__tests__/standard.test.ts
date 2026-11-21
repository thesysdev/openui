import type { LibraryJSONSchema } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import {
  a2uiPromptOptions,
  compileToA2UI,
  createA2UIStream,
  expressToOpenUI,
  openUIToExpress,
} from "../standard";

const CATALOG_ID = "https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json";

/**
 * Part of the A2UI Basic Catalog as an OpenUI library schema, the shape
 * `library.toJSONSchema()` produces: props in catalog order, enums inline, and
 * a `$ref` on props that hold component ids.
 */
const child = { $ref: "#/$defs/Component" };
const string = { type: "string" };
const components: Record<string, Record<string, unknown>> = {
  Text: { text: string, variant: { type: "string", enum: ["h1", "h2", "h3", "body", "caption"] } },
  Icon: { name: { type: "string", enum: ["arrowForward", "check", "event"] } },
  Row: { children: child, justify: string, align: string },
  Column: { children: child, justify: string, align: string },
  Card: { child },
  Divider: { axis: string },
  Button: { child, variant: string, action: {} },
  TextField: { label: string, value: string, variant: string },
  CheckBox: { label: string, value: { type: "boolean" } },
  ChoicePicker: {
    label: string,
    variant: string,
    options: { type: "array" },
    value: { type: "array" },
    displayStyle: string,
  },
  Slider: {
    label: string,
    min: { type: "number" },
    max: { type: "number" },
    value: { type: "number" },
  },
  DateTimeInput: {
    value: string,
    enableDate: { type: "boolean" },
    enableTime: { type: "boolean" },
    min: string,
    max: string,
    label: string,
  },
};
const schema: LibraryJSONSchema = {
  properties: Object.fromEntries(Object.keys(components).map((name) => [name, {}])),
  $defs: {
    Component: {},
    ...Object.fromEntries(
      Object.entries(components).map(([name, properties]) => [name, { properties }]),
    ),
  } as LibraryJSONSchema["$defs"],
};

// ─── Express programs, each also compiled through OpenUI Lang ────────────────

const EXPRESS: Record<string, string> = {
  flight: `$/flight = {number: "OU 1420", from: "SFO", to: "JFK", delay: 25, gate: "B12"}
root = Card(main)
main = Column([header, route, divider, actions])
header = Row([title, status], "spaceBetween", "center")
title = Text(formatString("Flight \${/flight/number}"), "h2")
status = Text(formatString("**Delayed \${/flight/delay} min**"), "body")
route = Row([from, arrow, to], "spaceBetween", "center")
from = Text($/flight/from, "h3")
arrow = Icon("arrowForward")
to = Text($/flight/to, "h3")
divider = Divider()
actions = Row([boarding_pass], "end")
boarding_pass = Button(boarding_pass_text, "primary", Event("openBoardingPass", {flight: $/flight/number}))
boarding_pass_text = Text("Boarding pass")`,
  signup: `$/user/name = ""
$/user/email = ""
$/plan = ["free"]
$/updates = true
root = Card(main)
main = Column([title, name, email, plan, updates, submit])
title = Text("Create your account", "h2")
name = TextField("Full name", $/user/name)
email = TextField("Email", $/user/email)
plan = ChoicePicker("Plan", "mutuallyExclusive", [{label: "Free", value: "free"}, {label: "Pro", value: "pro"}], $/plan, "chips")
updates = CheckBox("Send me product updates", $/updates)
submit = Button(submit_text, "primary", Event("signUp", {name: $/user/name, email: $/user/email, plan: $/plan}))
submit_text = Text("Sign up")`,
  booking: `$/booking = {party: 2, when: "", seating: ["indoor"]}
root = Card(main)
main = Column([title, party, when, seating, book])
title = Text("Reserve a table", "h2")
party = Slider("Party size", 1, 12, $/booking/party)
when = DateTimeInput($/booking/when, true, true, _, _, "Date and time")
seating = ChoicePicker("Seating", "mutuallyExclusive", [{label: "Indoor", value: "indoor"}, {label: "Patio", value: "patio"}], $/booking/seating, "chips")
book = Button(book_text, "primary", Event("book", {party: $/booking/party, when: $/booking/when}))
book_text = Text(formatDate($/booking/when, "E, MMM d"))`,
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("compileToA2UI", () => {
  it("maps statements, bindings, events and catalog functions", () => {
    const { components, data, errors } = compileToA2UI(
      `root = Card(main)
main = Column([hello, email, send], "start")
hello = Text(@formatString("Hi, \${/user/name}!"), "h2")
email = TextField("Email", $user.email)
send = Button(Text("Send"), "primary", @send({email: $user.email, first: $items[0]}))
$user = {name: "Ada", email: ""}
$items = ["a"]`,
      { schema },
    );

    expect(errors).toEqual([]);
    expect(data).toEqual({ user: { name: "Ada", email: "" }, items: ["a"] });
    expect(components).toEqual([
      { id: "root", component: "Card", child: "main" },
      { id: "main", component: "Column", children: ["hello", "email", "send"], justify: "start" },
      {
        id: "hello",
        component: "Text",
        text: { call: "formatString", args: { value: "Hi, ${/user/name}!" } },
        variant: "h2",
      },
      { id: "email", component: "TextField", label: "Email", value: { path: "/user/email" } },
      {
        id: "send",
        component: "Button",
        child: "send_0",
        variant: "primary",
        action: {
          event: {
            name: "send",
            context: { email: { path: "/user/email" }, first: { path: "/items/0" } },
          },
        },
      },
      { id: "send_0", component: "Text", text: "Send" },
    ]);
  });

  it("rejects what A2UI cannot express and enum values the catalog does not define", () => {
    const { components, errors } = compileToA2UI(
      `root = Card(t)
t = Text($count > 1 ? "many" : "one")
n = Text(@Count($items))
w = Widget("x")
icon = Icon("flight")`,
      { schema },
    );
    expect(components.map((c) => c.id)).toEqual(["root"]);
    expect(errors.map((e) => e.statementId)).toEqual(["t", "n", "w", "icon"]);
    expect(errors[3]!.message).toBe('Icon name "flight" is not in the catalog');
  });

  it("inlines named lists and holds back components whose values are not defined yet", () => {
    const later = compileToA2UI(
      `root = ChoicePicker("RSVP", null, opts, $rsvp)
opts = [{label: "Going", value: "yes"}]`,
      { schema },
    );
    expect(later.components[0]!.options).toEqual([{ label: "Going", value: "yes" }]);

    const missing = compileToA2UI(
      `root = Card(picker)
picker = ChoicePicker("RSVP", null, opts, $rsvp)`,
      { schema },
    );
    expect(missing.components.map((c) => c.id)).toEqual(["root"]);
    expect(missing.errors).toEqual([{ statementId: "picker", message: "opts is not defined" }]);
  });
});

describe("createA2UIStream", () => {
  it("sends only complete statements, then only what changed", () => {
    const stream = createA2UIStream({ schema, surfaceId: "s", catalogId: CATALOG_ID });
    expect(stream.push('root = Card(t)\nt = Text("hel')).toEqual([
      { version: "v1.0", createSurface: { surfaceId: "s", catalogId: CATALOG_ID } },
      {
        version: "v1.0",
        updateComponents: {
          surfaceId: "s",
          components: [{ id: "root", component: "Card", child: "t" }],
        },
      },
    ]);
    expect(stream.push('root = Card(t)\nt = Text("hello")\n$x = 1\n')).toEqual([
      { version: "v1.0", updateDataModel: { surfaceId: "s", path: "/x", value: 1 } },
      {
        version: "v1.0",
        updateComponents: {
          surfaceId: "s",
          components: [{ id: "t", component: "Text", text: "hello" }],
        },
      },
    ]);
    expect(stream.finish('root = Card(t)\nt = Text("hello")\n$x = 1').messages).toEqual([]);
  });

  it("waits while a statement spans several lines", () => {
    const stream = createA2UIStream({ schema, surfaceId: "s", catalogId: CATALOG_ID });
    stream.push("root = Card(c)\n");
    expect(stream.push("root = Card(c)\nc = Column([\n  a,\n")).toEqual([]);
  });
});

describe("Express programs through OpenUI Lang", () => {
  it.each(Object.entries(EXPRESS))("compiles the %s program without errors", (_, express) => {
    const stream = createA2UIStream({ schema, surfaceId: "demo", catalogId: CATALOG_ID });
    const { messages, errors } = stream.finish(expressToOpenUI(express));
    expect(errors).toEqual([]);
    expect(messages.some((m) => "updateComponents" in m)).toBe(true);
    // Translating back gives the same OpenUI Lang again.
    expect(expressToOpenUI(openUIToExpress(expressToOpenUI(express)))).toBe(
      expressToOpenUI(express),
    );
  });
});

describe("Express rewrites", () => {
  // The worked example from A2UI's Express spec, as used in a2ui-project/a2ui#3214.
  const express = `<a2ui>
root = Card(main_column)
main_column = Column([icon, title], _, "center")
icon = Icon($/icon)
yes_btn = Button(yes_btn_text, _, Event("accept"))
save_btn = Button(save_text, "primary", Event("save", {id: $/items/0/id}))
date = Text(formatDate($/when, "E, MMM d"))
</a2ui>`;
  const openui = `root = Card(main_column)
main_column = Column([icon, title], null, "center")
icon = Icon($icon)
yes_btn = Button(yes_btn_text, null, @accept())
save_btn = Button(save_text, "primary", @save({id: $items[0].id}))
date = Text(@formatDate($when, "E, MMM d"))`;

  it("turn Express into OpenUI Lang and back", () => {
    expect(expressToOpenUI(express)).toBe(openui);
    expect(openUIToExpress(openui)).toBe(express.replace(/<\/?a2ui>\n?/g, "").trim());
  });

  it("merge Express's per-path data and leave strings alone", () => {
    expect(expressToOpenUI(`$/form/email = ""\n$/form/address/city = "Oslo"`)).toBe(
      `$form = {email: "", address: {city: "Oslo"}}`,
    );
    expect(expressToOpenUI(`t = Text("_ $/x Event(\\"a\\")")`)).toBe(
      `t = Text("_ $/x Event(\\"a\\")")`,
    );
  });
});

describe("a2uiPromptOptions", () => {
  it("turns off OpenUI features A2UI does not have and lists the catalog functions", () => {
    const options = a2uiPromptOptions({ functions: ["formatDate"] });
    expect(options).toMatchObject({ bindings: false, toolCalls: false, builtinFunctions: false });
    expect(options.additionalRules!.join("\n")).toContain("@formatDate");
  });
});
