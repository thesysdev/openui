/**
 * A Slack bot whose replies are interactive OpenUI cards: streamed as Block
 * Kit while the model writes them, backed by tools through Query() and
 * Mutation(), with buttons, inputs, and form modals that update the card in
 * place, and thread conversations that remember earlier turns.
 *
 * Try: "a dashboard of my issues with open/closed filters and a form to file a new one"
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { MemoryStore } from "@openuidev/channels";
import { createSlackUI, FORM_CALLBACK_ID } from "@openuidev/channels/slack";
import { App } from "@slack/bolt";
import { streamText, type ModelMessage } from "ai";
import "dotenv/config";

const missing = ["THESYS_API_KEY", "SLACK_BOT_TOKEN", "SLACK_APP_TOKEN"].filter(
  (key) => !process.env[key],
);
if (missing.length) {
  console.error(`Missing ${missing.join(", ")}. Copy .env.example to .env and fill them in.`);
  process.exit(1);
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});
const gateway = createOpenAICompatible({
  name: "openui",
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});
const model = gateway(process.env.OPENUI_MODEL ?? "openai/gpt-5.5");

// 1. Tools: what Query() and Mutation() can call. Any MCP server works the same
//    way: map its listTools() to `specs` and callTool() to `provider`.
const issues = [{ title: "Fix login", state: "open" }];
const tools = {
  specs: [
    {
      name: "list_issues",
      description: "Count issues in a given state",
      inputSchema: {
        type: "object",
        properties: { state: { type: "string", enum: ["open", "closed"] } },
      },
      outputSchema: { type: "object", properties: { total: { type: "number" } } },
    },
    {
      name: "create_issue",
      description: "Create an open issue",
      inputSchema: {
        type: "object",
        properties: { title: { type: "string" } },
        required: ["title"],
      },
    },
  ],
  provider: {
    async callTool(name: string, args: Record<string, unknown>) {
      if (name === "list_issues") {
        return { total: issues.filter((i) => i.state === (args.state ?? "open")).length };
      }
      if (name === "create_issue") {
        issues.push({ title: String(args.title), state: "open" });
        return { ok: true };
      }
      throw new Error(`unknown tool: ${name}`);
    },
  },
};

// 2. One UI instance: prompt, rendering, and the per-message state store.
//    MemoryStore is fine for development; implement MessageStore ({ get, save })
//    over Redis or a database so buttons keep working across restarts.
const ui = createSlackUI({ tools, store: new MemoryStore() });

// 3. Conversation: each thread keeps its history, and earlier cards go back to
//    the model as the programs they were generated from.
const threads = new Map<string, ModelMessage[]>();

app.event("app_mention", async ({ event, client }) => {
  const threadTs = event.thread_ts ?? event.ts;
  const history = threads.get(threadTs) ?? [];
  history.push({ role: "user", content: event.text });

  const { textStream } = streamText({ model, system: ui.prompt, messages: history });
  const card = await ui.streamCard(
    client,
    { channel: event.channel, thread_ts: threadTs },
    textStream,
  );

  history.push({ role: "assistant", content: card.source });
  threads.set(threadTs, history);
});

// 4. Interactions: clicks and input changes re-render the card in place;
//    form buttons open a modal, and submitting it runs the form's action.
app.action(/.*/, async ({ ack, body, client }) => {
  await ack();
  await ui.handleAction(client, body);
});

app.view(FORM_CALLBACK_ID, async ({ ack, body, client }) => {
  await ack();
  await ui.handleViewSubmission(client, body);
});

await app.start();
console.info("Slack bot is running. Mention it in a channel it has been invited to.");
