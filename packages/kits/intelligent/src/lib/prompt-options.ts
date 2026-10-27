import type { PromptOptions } from "@openuidev/react-lang";
import { demoToolSpecs } from "./demo-data";

/**
 * Prompt options that teach the model to answer with working tools: the page
 * holds its inputs and lists in $variables and computes with @functions, so
 * it works without sending anything back to the assistant.
 */

export const exampleShoppingList = `root = Card([title, stepper, list, copy])
$guests = 4
$got = []
title = Title("Pasta night for " + @Plural($guests, "guest"), "lg")
stepper = Row([IconButton("minus", @Set($guests, @Clamp($guests - 1, 1, 20)), "Fewer"), Text($guests + "", "lg", null, "semibold"), IconButton("plus", @Set($guests, @Clamp($guests + 1, 1, 20)), "More")], 3)
lines = @Each(base, "i", {name: i.name, qty: @Round(i.qty * $guests / 4) + i.unit})
list = Col(@Each(lines, "l", Pressable([Row([Icon(@Includes($got, l.name) ? "check-circle" : "circle", "sm"), Text(l.qty + " " + l.name, "sm", null, null, false, @Includes($got, l.name))], 2)], @Set($got, @Toggle($got, l.name)), @Includes($got, l.name), 2)), 1)
copy = Button("Copy list", @CopyToClipboard(@Join(@Each(lines, "l", l.qty + " " + l.name), "\\n")), "outline", null, "sm", "copy")
base = [{name: "spaghetti", qty: 400, unit: " g"}, {name: "tomatoes", qty: 6, unit: ""}, {name: "parmesan", qty: 80, unit: " g"}]`;

export const exampleTrip = `root = Col([title, intro, photos, facts, Title("Day by day", "md"), days, prefs])
$pace = "Relaxed"
title = Title("Three days in Lisbon", "xl")
intro = Text("Hills, tiled facades and the Tagus: start in **Alfama**, give a day to Belém, then take the train to Sintra.")
photos = Carousel([SearchImage("Alfama Lisbon", 1.25), SearchImage("Belém Tower", 1.25), SearchImage("Pena Palace", 1.25)], 260)
facts = Row([Badge("Best in April to June"), Badge("Tram 28", "info"), Badge("About €120 a day", "success")], 2, null, null, true)
days = Col(@Each(plan, "d", Row([Box([SearchImage(d.place, 1, "lg")], null, null, null, null, null, null, 96), Col([Text([Icon("map-pin", "sm"), " Day " + d.day + " · " + d.title], "md", null, "semibold"), Text(d.text, "sm", "muted")], 1)], 4, "start")), 4)
prefs = Card([Title("Make it yours", "sm"), Form([RadioGroup($pace, ["Relaxed", "Packed"], "Pace", "pills"), Button("Plan my trip", @ToAssistant("Tailor my Lisbon trip"))])], "soft")
plan = [{day: 1, title: "Alfama", place: "São Jorge Castle", text: "Climb to the castle, then lunch on grilled sardines."}, {day: 2, title: "Belém", place: "Jerónimos Monastery", text: "The monastery, the tower and pastéis de Belém."}, {day: 3, title: "Sintra", place: "Pena Palace", text: "Train from Rossio; book the palace for 9 AM."}]`;

export const exampleSteps = `root = Col([head, viewer, strip])
$step = 0
head = Col([Title("Build a small bookcase", "xl"), Text("Four steps and about 30 minutes. You need the Allen key from the box and a hammer.", "md", "muted")], 2)
steps = [{title: "Lay out the parts", text: "Two sides, the top, one shelf and the bottom. Tap the 12 wooden dowels into the holes on the sides."}, {title: "Fix the boards to one side", text: "Push the top, shelf and bottom onto one side's dowels, then turn each cam lock clockwise until it pulls tight."}, {title: "Add the other side", text: "Fit the second side onto the free dowels and tighten its cam locks the same way."}, {title: "Nail on the back", text: "Lay it face down, check the corners are square, then nail the back panel about every 10 cm."}]
s0 = Svg([Rect(16, 20, 22, 120, "surface", "ink", 2), Rect(48, 20, 22, 120, "surface", "ink", 2), Rect(100, 28, 120, 16, "surface", "ink", 2), Rect(100, 68, 120, 16, "surface", "ink", 2), Rect(100, 108, 120, 16, "surface", "ink", 2), Circle(27, 36, 3, "chart1"), Circle(27, 80, 3, "chart1"), Circle(27, 124, 3, "chart1"), SvgText("Sides", 43, 154, 11, "muted", "middle"), SvgText("Top", 160, 22, 11, "muted", "middle"), SvgText("Shelf", 160, 62, 11, "muted", "middle"), SvgText("Bottom", 160, 102, 11, "muted", "middle")], "0 0 240 160")
s1 = Svg([Rect(40, 16, 18, 128, "surface", "ink", 2), Rect(58, 16, 130, 14, "surface", "ink", 2), Rect(58, 72, 130, 14, "surface", "ink", 2), Rect(58, 130, 130, 14, "surface", "ink", 2), Circle(68, 23, 4, "info"), Circle(68, 79, 4, "info"), Circle(68, 137, 4, "info"), Line(212, 79, 196, 79, "info", 2), Polygon("192,79 200,74 200,84", "info"), SvgText("Cam lock", 74, 104, 11, "info")], "0 0 240 160")
s2 = Svg([Rect(40, 16, 18, 128, "surface", "ink", 2), Rect(58, 16, 130, 14, "surface", "ink", 2), Rect(58, 72, 130, 14, "surface", "ink", 2), Rect(58, 130, 130, 14, "surface", "ink", 2), Rect(196, 16, 18, 128, "surface", "info", 2), Line(232, 80, 220, 80, "info", 2), Polygon("216,80 224,75 224,85", "info")], "0 0 240 160")
s3 = Svg([Rect(40, 16, 160, 128, "#EFE9DF", "ink", 2), Rect(40, 16, 160, 14, "surface", "ink", 2), Rect(40, 72, 160, 14, "surface", "ink", 2), Rect(40, 130, 160, 14, "surface", "ink", 2), Circle(48, 50, 2.5, "ink"), Circle(192, 50, 2.5, "ink"), Circle(48, 108, 2.5, "ink"), Circle(192, 108, 2.5, "ink"), SvgText("Back panel", 120, 56, 11, "muted", "middle")], "0 0 240 160")
drawings = [s0, s1, s2, s3]
viewer = Card([Row([Badge("Step " + ($step + 1) + " of 4", "info"), Spacer(), Caption(@Percent($step + 1, 4) + "% done")], 2), Box([drawings[$step]], null, null, 3, "surface", "lg"), Title(steps[$step].title, "md"), Text(steps[$step].text, "sm"), Row([Button("Back", @Set($step, @Clamp($step - 1, 0, 3)), "outline", null, null, "arrow-left", $step == 0), Spacer(), Button("Next step", @Set($step, @Clamp($step + 1, 0, 3)), "solid", null, null, "arrow-right", $step == 3)], 2)], null, 4, 3)
strip = Grid(@Each(@Range(0, 4), "i", Pressable([drawings[i], Caption((i + 1) + ". " + steps[i].title)], @Set($step, i), i == $step, 2)), 4, 110, 2)`;

export const exampleDashboard = `root = Col([head, kpis, Grid([weekly, byRegion], 2, 280, 4), top])
$region = "All"
orders = Query("get_orders", {days: 90}, {rows: []})
rows = $region == "All" ? orders.rows : @Filter(orders.rows, "region", "==", $region)
head = Row([Title("Sales, last 90 days", "lg"), Spacer(), SegmentedControl($region, ["All", "North", "South", "East", "West"])], 3, null, null, true)
kpis = Grid([Card([Caption("Revenue"), Title(@Format(@Sum(rows.amount), "compact", 1, "USD"), "xl")]), Card([Caption("Orders"), Title(@Format(@Count(rows)), "xl")])], 2, 160, 3)
weekly = Card([Title("Revenue by week", "sm"), Chart("line", @Bucket(rows, "date", "week", "amount"), "key", ["value"], "currency")])
byRegion = Card([Title("By region", "sm"), Chart("donut", @GroupBy(orders.rows, "region", "amount"), "key", ["value"], "currency")])
top = Table(["Product", "Revenue"], @Each(@Top(@GroupBy(rows, "product", "amount"), "value", 5), "p", [p.key, @Format(p.value, "currency")]))`;

const rules = [
  "Compose the answer like a page, not a form letter: a Title, a short Text, then a mix of blocks that show the content. SearchImage for every place, dish, product or thing that has a look (the app finds the photo, so never say you cannot show photos); Row, Grid and Carousel to set things side by side; Badge rows for quick facts; Card only to group a block; Popover for an aside.",
  "Spacing is a system with three tiers that always nest: inner (gap 1-2, 4-8px) for a title with its subtitle, tags or line; group (gap 3-4, 12-16px) between blocks inside a Card or grid cell; section (24px) between the blocks of the page. Leave gap unset on the page's root Col and on card contents: the app applies these tiers. Set a gap only on a Row or Grid. Never use one gap for everything, and never a gap larger than the section gap.",
  "A photo beside text is a media row: Row([Box([SearchImage(query, 1.33)]), Col([Title(..., \"md\"), Row([Badge(...), Badge(...)], 1, null, null, true), Text(..., \"sm\")], 2)], 4, \"start\"). The app sizes the photo to a third of the row (at most 200px) and top-aligns the text. Facts are Badges, never Buttons or boxed pills.",
  "Every SearchImage query names the exact subject the user will recognise (\"flat-pack bookshelf assembly\", \"Sonoma Plaza\"), never a generic scene. If no photo would show the subject, use no image.",
  "Keep cards compact and scannable: Title \"md\" (never lg or xl inside a Card), Text \"sm\" for the body, at most one short paragraph, then facts as Badges or label/value rows (Caption label, Spacer, Text value). Don't write bold-lead paragraphs like \"**Weekend rhythm:** ...\" or long prose in a card. Cards side by side in a Grid share the same blocks in the same order and the same SearchImage aspect ratio, so they line up. For example: c = Card([SearchImage(\"Sonoma Plaza\", 1.5), Col([Title(\"Sonoma\", \"md\"), Row([Badge(\"1 h drive\", null, \"car\"), Badge(\"Wine country\", \"purple\")], 1, null, null, true)], 2), Text(\"A slow plaza, tasting rooms and quiet back roads.\", \"sm\"), Col([Row([Caption(\"Best for\"), Spacer(), Text(\"Food and wine\", \"sm\")]), Row([Caption(\"Trade-off\"), Spacer(), Text(\"Tastings add up\", \"sm\")])], 1)])",
  "Answer with a working tool whenever the request involves numbers, choices, lists, steps, a game or something to explore: keep inputs and lists in $variables, compute everything shown from them with expressions and @functions, and change them with @Set. The page must work on its own, without another message.",
  "Use @ToAssistant only for what the page cannot compute: a Form's submit Button, or a new request (\"Plan another day\"). Its message is short and first person, like the user typing it (\"Help me choose a bike\"); the form values travel with it, so never repeat them in the message.",
  "$variable defaults are literals (numbers, strings, lists, objects), never expressions or @calls. Edit lists with @Append, @Remove, @RemoveAt and @Update; track selections with @Toggle and @Includes.",
  "cond ? a : b also picks between components; there is no @If. Use only the listed @functions; you cannot define your own.",
  "Derive rows once in a statement with @Each(list, \"x\", {...}), then reuse them in @Each, Table, Chart, @Sum(rows.field) and @Join. @Each(@Range(0, n), \"i\", ...) builds a series or repeats a step.",
  "@Random, @Pick and @Shuffle give a new value on every evaluation: call them inside @Set, so a click draws once and the page stays still.",
  "Pick the medium that shows the idea: Chart for numbers across time or categories; Svg drawings for shapes, parts and movement; Map with MapMarker for places and routes; Table for comparisons; Flashcard and Celebration for learning and games; HtmlView only for a game or animation that needs a loop.",
  "Draw with Svg whenever the user would otherwise have to picture it: assembly and how-to steps (a simple drawing for each step, like an instruction leaflet), knots and folds, how a machine, mechanism or the body works, geometry and science diagrams, the layout of a room, garden or board, chord and clock faces. A photo shows what a thing looks like; a drawing shows how it goes together or works, so a how-to or how-it-works answer has drawings even when it also has a photo. Keep each drawing simple: a viewBox about 240 wide, a dozen or so shapes in the listed colors with SvgText labels, a Line with a small Polygon head for an arrow, and let $variables such as the current step drive it.",
  "Format money, percentages and big numbers with @Format, counts with @Plural and dates with @FormatDate.",
  "Dates relative to now (today, this week, next month) start from @Today(), never a fixed date. <, >, <= and >= compare numbers only, so order two dates with @DaysBetween(a, b) > 0.",
  "To change a page from an earlier answer, keep its $variable names and start them from that answer's \"context and form values\", so what the user typed, added or ticked carries over.",
  "Read a number input for a count or amount through @Default and @Clamp with a sensible minimum, e.g. @Clamp(@Default($people, 1), 1, 50), so 0, empty or negative cannot divide by zero or zero out the page.",
  "Answer a plain knowledge or safety question with Markdown text, adding a SearchImage or a Quote only where it helps.",
];

/** The chat prompt: no tools, $variables and functions. */
export const promptOptions: PromptOptions = {
  bindings: true,
  additionalRules: rules,
  examples: [
    `Example 1: A guest stepper that rescales a shopping list, with a checklist and a copy button:\n\n${exampleShoppingList}`,
    `Example 2: A composed trip answer: photos, facts, day rows and a short form:\n\n${exampleTrip}`,
    `Example 3: Step-by-step instructions with a drawing for each step, driven by $step:\n\n${exampleSteps}`,
  ],
};

/** For dashboards over the demo data tools: Query rows, shaped with the data functions. */
export const dashboardPromptOptions: PromptOptions = {
  ...promptOptions,
  tools: demoToolSpecs,
  toolExamples: [`Example 4: A live dashboard over Query rows:\n\n${exampleDashboard}`],
  additionalRules: [
    ...rules,
    "Fetch rows with Query and compute every number, group and series from them with @Sum, @Count, @GroupBy, @Bucket, @Top, @Stats and @Change. A filter is a $variable (from this library's Select or SegmentedControl) applied with @Filter; select dates and ranges with @Between, since @Filter's < and > compare numbers only.",
  ],
};
