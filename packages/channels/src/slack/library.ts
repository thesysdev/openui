/**
 * The Slack component library. Each entry's Zod schema and description teach
 * the model (via library.prompt) what it may emit, and its render function -
 * stored in the component slot lang-core treats as opaque - produces Block Kit.
 *
 * Rendering conventions:
 *   - Block components (Header, Section, ...) render to Block Kit blocks.
 *   - Interactive controls (Button, Select, ...) render to Block Kit elements,
 *     registering their ActionEntry; containers (Actions, Section accessory)
 *     invoke them via renderControl.
 *   - Data components (Option, Field, Para, ...) render to nothing themselves;
 *     their parents consume their props directly.
 */
import type { ElementNode, ToolSpec } from "@openuidev/lang-core";
import { createLibrary, markReactive } from "@openuidev/lang-core";
import * as z from "zod/v4";
import type { ChannelLibrary, RenderArgs, RenderFn } from "../core/types";
import { defineBlockComponent } from "../core/walker";
import { chartBlock, chartPlaceholderBlock, isChartBlock } from "./charts";
import { asText, optionObj, placeholder } from "./helpers";
import { fieldSpec } from "./modal";
import type { SlackBlock } from "./types";

const def = (name: string, props: any, description: string, render: RenderFn) =>
  defineBlockComponent({ name, props, description, render });

/** A data component: consumed by its parent via props, renders nothing itself. */
const dataDef = (name: string, props: any, description: string) =>
  defineBlockComponent({ name, props, description, render: () => [] });

// Mark a prop schema as bindable to a $variable (two-way state binding).
const reactive = (schema: any) => {
  markReactive(schema);
  return schema;
};

const isElement = (n: unknown): n is ElementNode =>
  !!n && typeof n === "object" && (n as any).type === "element";

/**
 * Build the Slack element for one interactive control, registering its action.
 * Shared by the control components and by containers (Actions, Section
 * accessory), which dispatch children here rather than through ctx.walk so a
 * non-control child yields nothing instead of a block.
 */
/** Slack confirm dialog from a plain warning string. */
const confirmObj = (text: unknown) => ({
  title: { type: "plain_text", text: "Are you sure?" },
  text: { type: "plain_text", text: asText(text) },
  confirm: { type: "plain_text", text: "Yes" },
  deny: { type: "plain_text", text: "Cancel" },
});

const MULTI_KINDS = new Set([
  "Checkboxes",
  "MultiSelect",
  "MultiUserSelect",
  "MultiChannelSelect",
  "MultiConversationSelect",
]);

function renderControl({ props: p, node, ctx }: RenderArgs): unknown[] {
  const id = ctx.idFor(node);
  const kind = node.typeName;

  if (kind === "Button") {
    const plan = p.action;
    if (plan && Array.isArray(plan.steps)) ctx.registerAction(id, { kind: "action", plan });
    const style = p.style === "primary" || p.style === "danger" ? { style: p.style } : {};
    const confirm = p.confirm ? { confirm: confirmObj(p.confirm) } : {};
    return [
      {
        type: "button",
        text: { type: "plain_text", text: asText(p.label).slice(0, 75) },
        action_id: id,
        ...style,
        ...confirm,
      },
    ];
  }

  if (kind === "LinkButton") {
    // Opens a URL; Slack still sends a (no-op) action event, which the transport acks.
    return [
      {
        type: "button",
        text: { type: "plain_text", text: asText(p.label).slice(0, 75) },
        action_id: id,
        url: asText(p.url),
      },
    ];
  }

  // Inputs bound to a $variable; on change the transport sets that variable.
  const multi = MULTI_KINDS.has(kind);
  const target = ctx.bindTarget(multi ? p.values : p.value);
  if (target) ctx.registerAction(id, { kind: "input", target });
  const current = target ? ctx.state[target] : undefined;
  const options = (p.options ?? []).map(optionObj);
  const chosen = Array.isArray(current) ? current.map(asText) : [];
  const single = options.find((o: any) => o.value === asText(current));
  const many = options.filter((o: any) => chosen.includes(o.value));

  // Selects/radios/checkboxes/overflow need >=1 option; skip an empty one
  // rather than let Slack reject the whole message.
  const optionBased = ["Select", "MultiSelect", "Radio", "Checkboxes", "Overflow"].includes(kind);
  if (optionBased && !options.length) {
    console.warn(
      `[openui] ${kind} "${asText(p.name) || id}" has no options - likely a Query shape mismatch; skipping it`,
    );
    return [];
  }

  switch (kind) {
    case "Select":
      return [
        {
          type: "static_select",
          action_id: id,
          placeholder: placeholder(p.name, "Select"),
          options,
          ...(single ? { initial_option: single } : {}),
        },
      ];
    case "MultiSelect":
      return [
        {
          type: "multi_static_select",
          action_id: id,
          placeholder: placeholder(p.name, "Select"),
          options,
          ...(many.length ? { initial_options: many } : {}),
        },
      ];
    case "Radio":
      return [
        {
          type: "radio_buttons",
          action_id: id,
          options,
          ...(single ? { initial_option: single } : {}),
        },
      ];
    case "Checkboxes":
      return [
        {
          type: "checkboxes",
          action_id: id,
          options,
          ...(many.length ? { initial_options: many } : {}),
        },
      ];
    case "Overflow":
      return [{ type: "overflow", action_id: id, options }];
    case "DatePicker":
      return [
        {
          type: "datepicker",
          action_id: id,
          placeholder: placeholder(p.name, "Pick a date"),
          ...(current ? { initial_date: asText(current) } : {}),
        },
      ];
    case "TimePicker":
      return [
        {
          type: "timepicker",
          action_id: id,
          placeholder: placeholder(p.name, "Pick a time"),
          ...(current ? { initial_time: asText(current) } : {}),
        },
      ];
    case "DateTimePicker":
      return [
        {
          type: "datetimepicker",
          action_id: id,
          ...(current != null ? { initial_date_time: Number(current) } : {}),
        },
      ];
    case "UserSelect":
      return [
        {
          type: "users_select",
          action_id: id,
          placeholder: placeholder(p.name, "Select a user"),
          ...(current ? { initial_user: asText(current) } : {}),
        },
      ];
    case "MultiUserSelect":
      return [
        {
          type: "multi_users_select",
          action_id: id,
          placeholder: placeholder(p.name, "Select users"),
          ...(chosen.length ? { initial_users: chosen } : {}),
        },
      ];
    case "ChannelSelect":
      return [
        {
          type: "channels_select",
          action_id: id,
          placeholder: placeholder(p.name, "Select a channel"),
          ...(current ? { initial_channel: asText(current) } : {}),
        },
      ];
    case "MultiChannelSelect":
      return [
        {
          type: "multi_channels_select",
          action_id: id,
          placeholder: placeholder(p.name, "Select channels"),
          ...(chosen.length ? { initial_channels: chosen } : {}),
        },
      ];
    case "ConversationSelect":
      return [
        {
          type: "conversations_select",
          action_id: id,
          placeholder: placeholder(p.name, "Select a conversation"),
          ...(current ? { initial_conversation: asText(current) } : {}),
        },
      ];
    case "MultiConversationSelect":
      return [
        {
          type: "multi_conversations_select",
          action_id: id,
          placeholder: placeholder(p.name, "Select conversations"),
          ...(chosen.length ? { initial_conversations: chosen } : {}),
        },
      ];
    default:
      return [];
  }
}

// --- rich_text helpers (display-only content, consumed by RichText) ---
const textEl = (text: unknown) => ({ type: "text", text: asText(text) });
const rawCell = (text: string) => ({ type: "raw_text", text });
const boldCell = (text: string) => ({
  type: "rich_text",
  elements: [
    { type: "rich_text_section", elements: [{ type: "text", text, style: { bold: true } }] },
  ],
});

/** Convert a RichText child (Para/List/Quote/Code) to a rich_text sub-element. */
function richElement(node: any) {
  const p = node?.props ?? {};
  switch (node?.typeName) {
    case "List":
      return {
        type: "rich_text_list",
        style: p.ordered ? "ordered" : "bullet",
        elements: (p.items ?? []).map((t: any) => ({
          type: "rich_text_section",
          elements: [textEl(t)],
        })),
      };
    case "Quote":
      return { type: "rich_text_quote", elements: [textEl(p.text)] };
    case "Code":
      return { type: "rich_text_preformatted", elements: [textEl(p.text)] };
    case "Para":
      return { type: "rich_text_section", elements: [textEl(p.text)] };
    default:
      return null;
  }
}

// --- interactive controls (each bound to a $variable, except Button) ---
const Option = dataDef(
  "Option",
  z.object({ value: z.string(), label: z.string() }),
  "An option inside a Select, MultiSelect, Radio, Checkboxes, or Overflow.",
);

const Select = def(
  "Select",
  z.object({ name: z.string(), value: reactive(z.string()), options: z.array(Option.ref) }),
  'A single-select dropdown bound to a $variable. e.g. Select("priority", $priority, [Option("low", "Low"), Option("high", "High")]).',
  renderControl,
);

const MultiSelect = def(
  "MultiSelect",
  z.object({
    name: z.string(),
    values: reactive(z.array(z.string())),
    options: z.array(Option.ref),
  }),
  "A multi-select dropdown bound to a $variable holding an array of values.",
  renderControl,
);

const Radio = def(
  "Radio",
  z.object({ name: z.string(), value: reactive(z.string()), options: z.array(Option.ref) }),
  "A single-choice radio group bound to a $variable.",
  renderControl,
);

const Checkboxes = def(
  "Checkboxes",
  z.object({
    name: z.string(),
    values: reactive(z.array(z.string())),
    options: z.array(Option.ref),
  }),
  "A multi-select checkbox group bound to a $variable holding an array of values.",
  renderControl,
);

const DatePicker = def(
  "DatePicker",
  z.object({ name: z.string(), value: reactive(z.string()) }),
  'A date picker bound to a $variable holding a "YYYY-MM-DD" string.',
  renderControl,
);

const TimePicker = def(
  "TimePicker",
  z.object({ name: z.string(), value: reactive(z.string()) }),
  'A time picker bound to a $variable holding an "HH:mm" string.',
  renderControl,
);

const DateTimePicker = def(
  "DateTimePicker",
  z.object({ name: z.string(), value: reactive(z.number()) }),
  "A date and time picker bound to a $variable holding a Unix timestamp in seconds.",
  renderControl,
);

const Overflow = def(
  "Overflow",
  z.object({ name: z.string(), value: reactive(z.string()), options: z.array(Option.ref) }),
  "A compact overflow (…) menu; choosing an option sets a $variable. Max 5 options.",
  renderControl,
);

const Button = def(
  "Button",
  z.object({
    label: z.string(),
    action: z.any().optional(),
    style: z.string().optional(),
    confirm: z.string().optional(),
  }),
  'A clickable button. For interactivity, pass an action: Button("Increment", Action([@Set($count, $count + 1)])). Use @Reset($var) to restore a variable to its initial value. Optional style: "primary" (green, one per message) or "danger" (red). Optional confirm: a warning sentence shown in a confirmation dialog before the action runs, e.g. Button("Delete", Action([...]), "danger", "This cannot be undone."). Omit the action for a display-only button.',
  renderControl,
);

const LinkButton = def(
  "LinkButton",
  z.object({ label: z.string(), url: z.string() }),
  'A button that opens a URL in the browser, e.g. LinkButton("View docs", "https://example.com").',
  renderControl,
);

const UserSelect = def(
  "UserSelect",
  z.object({ name: z.string(), value: reactive(z.string()) }),
  "A dropdown of the workspace's members, bound to a $variable holding a user id. Use for assignee or owner pickers.",
  renderControl,
);

const MultiUserSelect = def(
  "MultiUserSelect",
  z.object({ name: z.string(), values: reactive(z.array(z.string())) }),
  "A multi-select of workspace members, bound to a $variable holding an array of user ids.",
  renderControl,
);

const ChannelSelect = def(
  "ChannelSelect",
  z.object({ name: z.string(), value: reactive(z.string()) }),
  "A dropdown of the workspace's public channels, bound to a $variable holding a channel id.",
  renderControl,
);

const MultiChannelSelect = def(
  "MultiChannelSelect",
  z.object({ name: z.string(), values: reactive(z.array(z.string())) }),
  "A multi-select of public channels, bound to a $variable holding an array of channel ids.",
  renderControl,
);

const ConversationSelect = def(
  "ConversationSelect",
  z.object({ name: z.string(), value: reactive(z.string()) }),
  "A dropdown of conversations (channels, DMs, group DMs), bound to a $variable holding a conversation id.",
  renderControl,
);

const MultiConversationSelect = def(
  "MultiConversationSelect",
  z.object({ name: z.string(), values: reactive(z.array(z.string())) }),
  "A multi-select of conversations, bound to a $variable holding an array of conversation ids.",
  renderControl,
);

// Every interactive control, valid inside Actions and as a Section accessory.
const controls = [
  Button.ref,
  LinkButton.ref,
  Select.ref,
  MultiSelect.ref,
  Radio.ref,
  Checkboxes.ref,
  DatePicker.ref,
  TimePicker.ref,
  DateTimePicker.ref,
  Overflow.ref,
  UserSelect.ref,
  MultiUserSelect.ref,
  ChannelSelect.ref,
  MultiChannelSelect.ref,
  ConversationSelect.ref,
  MultiConversationSelect.ref,
];

// --- content ---
const Field = dataDef(
  "Field",
  z.object({ label: z.string(), value: z.string() }),
  "A key/value pair shown inside Fields.",
);

const Fields = def(
  "Fields",
  z.object({ items: z.array(Field.ref) }),
  "A grid of key/value pairs. Use for metadata, stats, or summaries.",
  ({ props: p }) => [
    {
      type: "section",
      fields: (p.items ?? []).slice(0, 10).map((f: any) => ({
        type: "mrkdwn",
        text: `*${asText(f.props?.label)}*\n${asText(f.props?.value)}`,
      })),
    },
  ],
);

const Header = def(
  "Header",
  z.object({ text: z.string() }),
  "A short headline (<=150 chars). Plain text only, no markdown.",
  ({ props: p }) => [
    { type: "header", text: { type: "plain_text", text: asText(p.text).slice(0, 150) } },
  ],
);

const Image = def(
  "Image",
  z.object({ url: z.string(), alt: z.string() }),
  "An image from a public URL, e.g. an avatar.",
  ({ props: p }) => [
    { type: "image", image_url: asText(p.url), alt_text: asText(p.alt) || "image" },
  ],
);

const imageEl = (img: any) => ({
  type: "image",
  image_url: asText(img?.props?.url),
  alt_text: asText(img?.props?.alt) || "image",
});

const Section = def(
  "Section",
  z.object({ text: z.string(), accessory: z.union([...controls, Image.ref] as any).optional() }),
  "A body paragraph. Supports Slack markdown: *bold*, _italic_, `code`, <url|link>. Optional accessory: one control (button, select, etc.) or an Image, shown to the right of the text.",
  ({ props: p, ctx }) => {
    const block: SlackBlock = {
      type: "section",
      text: { type: "mrkdwn", text: asText(p.text).slice(0, 3000) },
    };
    if (p.accessory && isElement(p.accessory)) {
      const acc =
        p.accessory.typeName === "Image"
          ? imageEl(p.accessory)
          : renderControl({ props: p.accessory.props ?? {}, node: p.accessory, ctx })[0];
      if (acc) block.accessory = acc;
    }
    return [block];
  },
);

const Context = def(
  "Context",
  z.object({ text: z.string(), images: z.array(Image.ref).optional() }),
  "Small muted helper text, e.g. a timestamp or footnote. Optional images: small inline icons/avatars shown before the text.",
  ({ props: p }) => [
    {
      type: "context",
      elements: [
        ...(p.images ?? []).slice(0, 9).map(imageEl),
        { type: "mrkdwn", text: asText(p.text) },
      ],
    },
  ],
);

const Divider = def("Divider", z.object({}), "A horizontal rule between sections.", () => [
  { type: "divider" },
]);

const Video = def(
  "Video",
  z.object({
    url: z.string(),
    title: z.string(),
    thumbnailUrl: z.string(),
    description: z.string().optional(),
  }),
  'An embedded video player. url must be an embeddable https video URL (e.g. a YouTube embed link), thumbnailUrl a public image. e.g. Video("https://www.youtube.com/embed/abc", "Demo", "https://example.com/thumb.png").',
  ({ props: p }) => [
    {
      type: "video",
      video_url: asText(p.url),
      title: { type: "plain_text", text: asText(p.title).slice(0, 200) },
      thumbnail_url: asText(p.thumbnailUrl),
      alt_text: asText(p.title) || "video",
      ...(p.description != null
        ? { description: { type: "plain_text", text: asText(p.description).slice(0, 200) } }
        : {}),
    },
  ],
);

const TextBox = def(
  "TextBox",
  z.object({ label: z.string(), value: reactive(z.string()) }),
  "A single-line text entry field directly in the message, bound to a $variable; the value is submitted when the user presses Enter. Use for quick inline input (a search box, a note); use Form for multi-field input.",
  ({ props: p, node, ctx }) => {
    const id = ctx.idFor(node);
    const target = ctx.bindTarget(p.value);
    if (target) ctx.registerAction(id, { kind: "input", target });
    const current = target ? ctx.state[target] : undefined;
    return [
      {
        type: "input",
        dispatch_action: true,
        label: { type: "plain_text", text: asText(p.label).slice(0, 2000) || "Input" },
        element: {
          type: "plain_text_input",
          action_id: id,
          dispatch_action_config: { trigger_actions_on: ["on_enter_pressed"] },
          ...(current != null && current !== "" ? { initial_value: asText(current) } : {}),
        },
      },
    ];
  },
);

const Chart = def(
  "Chart",
  z.object({
    type: z.string(),
    labels: z.array(z.string()),
    values: z.array(z.number()),
    title: z.string().optional(),
    series: z.string().optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  'An interactive chart rendered natively by Slack, with a title, axes, and a legend. type is "bar", "line", "pie", or "area". labels and values are parallel arrays (at most 20 points; pie: at most 12 slices, every value > 0). Optional: title, series (legend name for the values), xLabel and yLabel (axis titles). Compute values from live data with @Count/@Sum/@Filter. At most 2 charts per message. e.g. Chart("bar", ["Todo","Doing","Done"], [5,3,8], "Issues by state", "Issues", "Status", "Count").',
  // A Chart becomes a native data_visualization block. The ChartSpec is still
  // recorded under the block's id so a transport can rasterize it instead when
  // the workspace rejects the native block (and for the 3rd+ chart, which
  // finalize downgrades to a placeholder image: Slack caps native charts at 2).
  ({ props: p, ctx }) => {
    const spec = {
      type: asText(p.type) || "bar",
      labels: (p.labels ?? []).map(asText),
      values: (p.values ?? []).map((v: any) => Number(v)),
      title: p.title != null ? asText(p.title) : undefined,
      series: p.series != null ? asText(p.series) : undefined,
      xLabel: p.xLabel != null ? asText(p.xLabel) : undefined,
      yLabel: p.yLabel != null ? asText(p.yLabel) : undefined,
    };
    const id = ctx.addChart(spec);
    const block = chartBlock({ id, ...spec });
    return block ? [block] : [];
  },
);

const Markdown = def(
  "Markdown",
  z.object({ text: z.string() }),
  "A block of Markdown text - supports full Markdown (headings, lists, bold, links).",
  ({ props: p }) => [{ type: "markdown", text: asText(p.text) }],
);

const Table = def(
  "Table",
  z.object({ headers: z.array(z.string()), rows: z.array(z.array(z.string())) }),
  'A table. headers are the column titles; rows is an array of rows, each an array of cell strings. e.g. Table(["Title", "Priority"], [["Fix login", "High"], ["Write docs", "Low"]]).',
  // A bold header row plus raw-text data rows, within Slack's table caps.
  ({ props: p }) => {
    const headers = (p.headers ?? []).map(asText);
    const dataRows = (p.rows ?? []).map((r: any) =>
      (Array.isArray(r) ? r : []).map(asText).slice(0, 20),
    );
    const rows: any[] = [];
    if (headers.length) rows.push(headers.slice(0, 20).map(boldCell));
    for (const r of dataRows.slice(0, headers.length ? 99 : 100)) rows.push(r.map(rawCell));
    return rows.length ? [{ type: "table", rows }] : [];
  },
);

const Para = dataDef("Para", z.object({ text: z.string() }), "A paragraph inside RichText.");
const Quote = dataDef("Quote", z.object({ text: z.string() }), "A block quote inside RichText.");
const Code = dataDef(
  "Code",
  z.object({ text: z.string() }),
  "A preformatted code block inside RichText.",
);
const List = dataDef(
  "List",
  z.object({ items: z.array(z.string()), ordered: z.boolean().optional() }),
  "A list inside RichText; ordered=true for a numbered list, otherwise bulleted.",
);
const RichText = def(
  "RichText",
  z.object({ items: z.array(z.union([Para.ref, List.ref, Quote.ref, Code.ref])) }),
  "Structured formatted text: paragraphs, lists, quotes, and code blocks. Use for real bullet lists, quotes, or code that Section markdown renders poorly.",
  ({ props: p }) => [
    { type: "rich_text", elements: (p.items ?? []).map(richElement).filter(Boolean) },
  ],
);

// --- form fields (consumed by Form via fieldSpec, not rendered in the message) ---
const TextInput = dataDef(
  "TextInput",
  z.object({ label: z.string(), value: reactive(z.string()) }),
  "A single-line text field inside a Form, bound to a $variable.",
);
const TextArea = dataDef(
  "TextArea",
  z.object({ label: z.string(), value: reactive(z.string()) }),
  "A multi-line text field inside a Form, bound to a $variable.",
);
const NumberInput = dataDef(
  "NumberInput",
  z.object({ label: z.string(), value: reactive(z.number()) }),
  "A numeric field inside a Form, bound to a $variable.",
);
const EmailInput = dataDef(
  "EmailInput",
  z.object({ label: z.string(), value: reactive(z.string()) }),
  "An email address field inside a Form, bound to a $variable. Slack validates the format.",
);
const URLInput = dataDef(
  "URLInput",
  z.object({ label: z.string(), value: reactive(z.string()) }),
  "A URL field inside a Form, bound to a $variable. Slack validates the format.",
);

const Form = def(
  "Form",
  z.object({
    title: z.string(),
    submit: z.string(),
    fields: z.array(
      z.union([
        TextInput.ref,
        TextArea.ref,
        NumberInput.ref,
        EmailInput.ref,
        URLInput.ref,
        Select.ref,
        MultiSelect.ref,
        DatePicker.ref,
        TimePicker.ref,
        DateTimePicker.ref,
      ]),
    ),
    action: z.any().optional(),
  }),
  'A form. Renders as one button labeled `title`; clicking opens a modal of fields. Submitting sets each field\'s $variable, then runs the optional action - put the saving Mutation there so a single button both fills and submits. e.g. Form("New issue", "Create", [TextInput("Title", $title), Select("team", $team, teamOptions)], Action([@Run(createIssue)])).',
  ({ props: p, node, ctx }) => {
    const id = ctx.idFor(node, "form");
    ctx.registerForm(id, {
      title: asText(p.title),
      submit: asText(p.submit) || "Submit",
      fields: (p.fields ?? []).map((n: any) => fieldSpec(n, ctx)).filter(Boolean),
      action: p.action && Array.isArray(p.action.steps) ? p.action : undefined,
    });
    return [
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: asText(p.title).slice(0, 75) || "Open form" },
            action_id: `form:${id}`,
          },
        ],
      },
    ];
  },
);

const Actions = def(
  "Actions",
  z.object({ items: z.array(z.union(controls as any)) }),
  "A row of interactive controls: buttons, selects, radios, checkboxes, date/time pickers, and overflow menus.",
  ({ props: p, ctx }) => {
    // Slack rejects multi-select menus inside actions blocks (section accessory
    // and input blocks only), so each multi-select is wrapped in its own
    // dispatching input block instead of joining the actions row.
    const elements: any[] = [];
    const inputBlocks: SlackBlock[] = [];
    for (const n of (p.items ?? []).slice(0, 25)) {
      if (!isElement(n)) continue;
      for (const el of renderControl({ props: n.props ?? {}, node: n, ctx }) as any[]) {
        if (typeof el?.type === "string" && el.type.startsWith("multi_")) {
          inputBlocks.push({
            type: "input",
            dispatch_action: true,
            label: { type: "plain_text", text: asText((n as any).props?.name) || "Select" },
            element: el,
          });
        } else {
          elements.push(el);
        }
      }
    }
    return [...(elements.length ? [{ type: "actions", elements }] : []), ...inputBlocks];
  },
);

const Root = def(
  "Root",
  z.object({
    children: z.array(
      z.union([
        Header.ref,
        Section.ref,
        Fields.ref,
        Context.ref,
        Divider.ref,
        Image.ref,
        Video.ref,
        Chart.ref,
        Markdown.ref,
        Table.ref,
        RichText.ref,
        TextBox.ref,
        Form.ref,
        Actions.ref,
      ]),
    ),
  }),
  "The top-level message container. Every program must define root = Root([...]).",
  ({ props: p, ctx }) => ctx.walk(p.children ?? []),
);

/** The component library - drives Block Kit rendering, parsing, and prompt generation. */
export const library = createLibrary({
  root: "Root",
  components: [
    Option,
    Select,
    MultiSelect,
    Radio,
    Checkboxes,
    DatePicker,
    TimePicker,
    DateTimePicker,
    Overflow,
    Button,
    LinkButton,
    UserSelect,
    MultiUserSelect,
    ChannelSelect,
    MultiChannelSelect,
    ConversationSelect,
    MultiConversationSelect,
    Field,
    Fields,
    Header,
    Section,
    Context,
    Divider,
    Image,
    Video,
    Chart,
    Markdown,
    Table,
    Para,
    Quote,
    Code,
    List,
    RichText,
    TextBox,
    TextInput,
    TextArea,
    NumberInput,
    EmailInput,
    URLInput,
    Form,
    Actions,
    Root,
  ],
});

/** First header/section text, used as the message's notification fallback. */
function fallbackText(node: any): string {
  const p = node?.props ?? {};
  if (node?.typeName === "Header" || node?.typeName === "Section") return asText(p.text);
  for (const child of p.children ?? p.items ?? []) {
    const t = fallbackText(child);
    if (t) return t;
  }
  return "";
}

/** Interactive element types that are not blocks; they belong inside actions/section/input. */
const ELEMENT_TYPES = new Set([
  "button",
  "static_select",
  "multi_static_select",
  "radio_buttons",
  "checkboxes",
  "overflow",
  "datepicker",
  "timepicker",
  "datetimepicker",
  "users_select",
  "multi_users_select",
  "channels_select",
  "multi_channels_select",
  "conversations_select",
  "multi_conversations_select",
]);

/**
 * Wrap stray interactive elements (e.g. a Button the model placed directly in
 * Root) into actions blocks so the message stays valid Block Kit.
 */
function gatherStrayElements(items: SlackBlock[]): SlackBlock[] {
  const blocks: SlackBlock[] = [];
  let run: SlackBlock[] = [];
  const flush = () => {
    if (run.length) blocks.push({ type: "actions", elements: run.slice(0, 25) });
    run = [];
  };
  for (const item of items) {
    if (ELEMENT_TYPES.has(item?.type)) run.push(item);
    else {
      flush();
      blocks.push(item);
    }
  }
  flush();
  return blocks;
}

/** The Slack channel: the library plus Slack's message envelope. */
export const slackChannel: ChannelLibrary<SlackBlock[]> = {
  library: library as any,
  finalize(items, root) {
    // Slack allows at most 2 data_visualization blocks per message; extras
    // become placeholder images for the transport's rasterize-and-upload path.
    let nativeCharts = 0;
    const blocks = gatherStrayElements(items as SlackBlock[]).map((b) =>
      isChartBlock(b) && ++nativeCharts > 2 ? chartPlaceholderBlock(b.block_id, b.title) : b,
    );
    return {
      output: blocks.slice(0, 50), // Slack caps a message at 50 blocks.
      text: fallbackText(root) || "OpenUI message",
    };
  },
  errorMessage() {
    return {
      output: [
        {
          type: "section",
          text: { type: "mrkdwn", text: ":warning: Could not render UI from the model output." },
        },
      ],
      text: "Could not render UI",
    };
  },
};

/**
 * Build the system prompt. Passing the connected MCP tools enables
 * Query()/Mutation(); extraRules lets the host app append deployment-specific
 * guidance (e.g. conventions for a particular MCP server).
 */
export function buildSystemPrompt(tools?: ToolSpec[], extraRules: string[] = []): string {
  const hasTools = !!(tools && tools.length);
  const rules = [
    "Write every statement on its own top-level line as `name = Expression`. NEVER put a `name = ...` assignment inside an array or inside Root([...]).",
    "Arrays (Root's children, Actions items, Form fields, etc.) contain only references or inline components - never assignments.",
    "Query() and Mutation() must each be their own top-level statement; they cannot appear inside an array or as a nested value.",
    "Statement order: `root = Root([...])` FIRST, then $variable declarations, then each component in the order it appears in the card. The card streams to the user as you write it - blocks render as soon as their statements arrive - so this order makes the UI build top-to-bottom.",
  ];
  if (hasTools) {
    rules.push(
      "Reference Query results using the exact field names from each tool's output signature above; do not invent wrapper fields like .items, .nodes, or .rows.",
      "When a Select feeds a Mutation argument that needs an id (e.g. a team or assignee id), make each Option's value that id, not the display name.",
      "Put a form's saving Mutation in the Form's action (4th arg) so one button both fills and submits; do not add a separate submit button.",
    );
  }
  rules.push(...extraRules);
  return library.prompt({ bindings: true, toolCalls: hasTools, tools, additionalRules: rules });
}

/** Default prompt (no tools). */
export const systemPrompt = buildSystemPrompt();
