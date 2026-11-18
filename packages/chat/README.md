# @openuidev/chat

Generative UI for chat platforms. The model writes [OpenUI Lang](https://openui.com), and this package turns it into native [Chat SDK](https://chat-sdk.dev) cards, which become Block Kit on Slack, Adaptive Cards on Teams, and the equivalent on Google Chat and Discord. Cards stream: the card is posted as soon as the root component arrives, then edited (every 300 ms by default, `updateIntervalMs`) as each text block, field, table row, chart and button finishes.

```bash
npm install @openuidev/chat chat zod
```

## Usage

```ts
import { createSlackAdapter } from "@chat-adapter/slack";
import { createMemoryState } from "@chat-adapter/state-memory";
import { chatLibrary, chatPromptOptions, parseChatAction, streamCard } from "@openuidev/chat";
import { streamText } from "ai";
import { Chat } from "chat";

const system = chatLibrary.prompt(chatPromptOptions);

const bot = new Chat({
  userName: "openui",
  adapters: { slack: createSlackAdapter() },
  state: createMemoryState(),
});

async function reply(thread, prompt) {
  const { textStream } = streamText({ model, system, prompt });
  await streamCard(thread, textStream);
}

bot.onNewMention((thread, message) => reply(thread, message.text));

// Buttons and selects send a follow-up message to the assistant
bot.onAction(async (event) => {
  const action = parseChatAction(event);
  if (action?.type === "continue_conversation" && event.thread) {
    await reply(event.thread, action.humanFriendlyMessage);
  }
});
```

If the model answers without a card, `streamCard` posts the plain text instead.

## Components

| Component                                      | Renders as                                |
| ---------------------------------------------- | ----------------------------------------- |
| `Card`                                         | The message card (title, subtitle, image) |
| `Section`                                      | A group of children                       |
| `TextContent`                                  | Markdown text                             |
| `Fields`, `Field`                              | Label/value pairs                         |
| `Table`                                        | Native table                              |
| `BarChart`, `LineChart`, `AreaChart`, `Series` | Native chart (Slack `data_visualization`) |
| `PieChart`                                     | Native pie chart                          |
| `Image`, `Divider`, `Link`                     | Image, divider, inline link               |
| `Actions`, `Button`, `Select`, `SelectItem`    | Buttons and dropdowns                     |

Platforms without native tables or charts fall back to text, following the Chat SDK adapter.

## Actions

| OpenUI Lang               | On click                                                                   |
| ------------------------- | -------------------------------------------------------------------------- |
| `@ToAssistant("message")` | `parseChatAction` returns a `continue_conversation` event with the message |
| `@OpenUrl("https://...")` | A link button. The platform opens the URL and no event is sent             |
| Custom `Action([...])`    | A `custom` event with the action name and params                           |
| `Select`                  | A `continue_conversation` event with the select label and the chosen value |

Platforms cap button payloads, so a button's value is limited to 2000 characters. Hidden context is dropped first if a payload is too large.

## Differences from the browser renderers

A chat message is static. `Query()`, `Mutation()`, `$state` bindings and reactive expressions do not run in it. `$variables` render with their default values, and every interaction goes back to the assistant, which replies with a new card. The prompt from `chatPromptOptions` tells the model this.

## Custom components

`chatLibrary` is built with `createLibrary` from `@openuidev/lang-core`. A component renderer returns a Chat SDK element:

```ts
import { createLibrary, defineComponent } from "@openuidev/lang-core";
import { CardText } from "chat";
import { z } from "zod";
import type { ChatComponentRenderer } from "@openuidev/chat";

const Callout = defineComponent<ChatComponentRenderer>({
  name: "Callout",
  props: z.object({ text: z.string() }),
  description: "A highlighted note",
  component: (props) => CardText(`> ${props["text"]}`),
});
```

Pass your library to `streamCard(thread, textStream, { library })` or `renderCard(result, library)`.

## Demo bot

`demo/slack-bot.ts` is a Slack bot over Socket Mode, so no public URL is needed:

```bash
SLACK_BOT_TOKEN=xoxb-... SLACK_APP_TOKEN=xapp-... OPENAI_API_KEY=... pnpm demo
```

`pnpm demo:render "your prompt"` prints the OpenUI Lang, and the Block Kit generated from it, for a single prompt.
