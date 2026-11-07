/**
 * Prints the OpenUI Lang, the Chat SDK card and the Slack Block Kit for one prompt.
 *
 *   THESYS_API_KEY=... pnpm demo:render "How did Q3 go?"
 */
import { cardToBlockKit } from "@chat-adapter/slack";
import { streamText } from "ai";
import type { CardElement } from "chat";
import { chatLibrary, chatPromptOptions, streamCard } from "../src/index";
import { model } from "./model";

const prompt = process.argv.slice(2).join(" ") || "Show me last week's support ticket stats";
const result = streamText({ model, system: chatLibrary.prompt(chatPromptOptions), prompt });

let card: CardElement | undefined;
const { text, errors } = await streamCard(
  {
    post: async (m) => {
      if (typeof m !== "string") card = m;
      return { edit: async (e) => void (typeof e !== "string" && (card = e)) };
    },
  },
  result.textStream,
);

console.log(text, "\n");
if (errors.length) console.log("errors:", errors);
if (card) console.log(JSON.stringify({ blocks: cardToBlockKit(card) }, null, 2));
