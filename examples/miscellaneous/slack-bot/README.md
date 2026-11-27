# Slack bot

A Slack bot that answers with interactive OpenUI cards instead of markdown, built with [`@openuidev/channels`](https://www.npmjs.com/package/@openuidev/channels) and [Bolt](https://tools.slack.dev/bolt-js). It shows:

- **Streaming:** the card streams into the thread as Block Kit while the model writes it.
- **Tools:** `Query()` and `Mutation()` call your own functions, here a small in-memory issue tracker.
- **Interactions:** buttons and inputs update the card in place without calling the model again, and forms open a Slack modal.
- **Conversation:** each thread keeps its history, so follow-ups like "now only closed ones" work.

It runs over Socket Mode, so it needs no public URL.

## 1. Create the Slack app

Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From an app manifest**, pick your workspace, and paste:

```yaml
display_information:
  name: OpenUI Agent
features:
  bot_user:
    display_name: openui-agent
    always_online: true
oauth_config:
  scopes:
    bot:
      - app_mentions:read # @mentions trigger a reply
      - chat:write # post and update cards
settings:
  event_subscriptions:
    bot_events:
      - app_mention
  interactivity:
    is_enabled: true # button clicks and modal submits arrive over the socket
  socket_mode_enabled: true
  org_deploy_enabled: false
  token_rotation_enabled: false
```

Then:

1. **App-level token:** Basic Information → **App-Level Tokens** → Generate, with scope `connections:write`. Copy the `xapp-…` value.
2. **Install:** Install App → Install to Workspace → Allow. Copy the Bot User OAuth Token `xoxb-…`.
3. **Invite the bot** to a channel: `/invite @openui-agent`.

## 2. Run it

```bash
cd examples/miscellaneous/slack-bot
pnpm install --ignore-workspace
cp .env.example .env
pnpm generate:apiKey   # or paste a key from https://console.thesys.dev/keys
```

Set `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` in `.env`, then run `pnpm dev`.

In the channel, try:

```
@openui-agent a dashboard of my issues with open/closed filters and a form to file a new one
```

The filter buttons re-run `list_issues`, and submitting the form calls `create_issue`, after which the count updates. Mention the bot again in the same thread to change the card.

## How it works

The model writes an OpenUI Lang program using the Slack component library in `ui.prompt`. `ui.streamCard` posts a placeholder, updates it with the partial card as the program streams, then renders the finished card and saves its program and state. Clicks and form submits re-run that same program against the new state and edit the message in place.

| Piece                                       | Purpose                                                          |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `createSlackUI({ tools, store })`           | Prompt, rendering, and per-message state                         |
| `ui.streamCard(client, target, textStream)` | Post and stream a card, resolve to its program and state         |
| `ui.handleAction(client, body)`             | Buttons, selects, and pickers: re-render in place or open a form |
| `ui.handleViewSubmission(client, body)`     | Form modal submits                                               |

Everything is in `src/index.ts`. To use your own data, replace the `tools` object: `specs` describe each tool to the model, and `provider.callTool` runs them. To keep cards interactive across restarts, swap `MemoryStore` for your own `MessageStore` (`get` and `save`) over Redis or a database.

```bash
pnpm verify   # typecheck
```
