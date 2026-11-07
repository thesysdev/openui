/**
 * A Slack bot that answers with OpenUI cards, over Socket Mode.
 *
 *   SLACK_BOT_TOKEN=xoxb-... SLACK_APP_TOKEN=xapp-... THESYS_API_KEY=... pnpm demo
 */
import { createSlackAdapter } from "@chat-adapter/slack";
import { createMemoryState } from "@chat-adapter/state-memory";
import type { ModelMessage } from "ai";
import { streamText } from "ai";
import type { Channel, Thread } from "chat";
import { Chat } from "chat";
import { chatLibrary, chatPromptOptions, parseChatAction, streamCard } from "../src/index";
import { model } from "./model";

interface ThreadState {
  history: ModelMessage[];
}

const system = chatLibrary.prompt({
  ...chatPromptOptions,
  preamble:
    "You are OpenUI, a helpful assistant in Slack. Answer every message with one OpenUI card. Invent plausible sample data when the user asks about data you do not have, and say it is sample data.",
});

const adapters = { slack: createSlackAdapter({ mode: "socket" }) };
const bot = new Chat<typeof adapters, ThreadState>({
  userName: "openui",
  adapters,
  state: createMemoryState(),
});

// In DMs, keep the conversation at the top level instead of opening a thread per card
function conversation(thread: Thread<ThreadState>): Thread<ThreadState> | Channel<ThreadState> {
  return thread.isDM ? thread.channel : thread;
}

async function reply(thread: Thread<ThreadState>, text: string) {
  const target = conversation(thread);
  const history: ModelMessage[] = [
    ...((await target.state)?.history ?? []),
    { role: "user", content: text },
  ];
  await target.startTyping("Thinking...");
  const result = streamText({ model, system, messages: history });
  const { text: answer, errors } = await streamCard(target, result.textStream);
  if (errors.length) console.warn("[openui]", errors.map((e) => e.message).join("\n"));
  await target.setState({ history: [...history, { role: "assistant", content: answer }] });
}

bot.onNewMention(async (thread, message) => {
  await thread.subscribe();
  await reply(thread, message.text);
});

bot.onDirectMessage(async (thread, message) => {
  await thread.subscribe();
  await reply(thread, message.text);
});

bot.onSubscribedMessage(async (thread, message) => {
  await reply(thread, message.text);
});

// Buttons and selects on an OpenUI card continue the conversation
bot.onAction(async (event) => {
  const action = parseChatAction(event);
  if (!action || !event.thread || action.type !== "continue_conversation") return;
  const context = action.params["context"];
  await reply(
    event.thread as Thread<ThreadState>,
    context === undefined
      ? action.humanFriendlyMessage
      : `${action.humanFriendlyMessage}\n\nContext: ${JSON.stringify(context)}`,
  );
});

await bot.initialize();
console.log("OpenUI Slack bot is running. Mention it or send it a DM.");
