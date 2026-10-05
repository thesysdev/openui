# MiniApps

A self-hosted OpenUI agent that builds interactive dashboards inside chat. It starts from the OpenUI self-hosted Next.js template and adds streamed MiniApp artifacts, real GitHub/npm tools, and browser persistence.

The main agent answers with generative UI and calls a dashboard builder when a user wants a MiniApp. MiniApps appear as inline previews, open in AgentInterface's detailed view, and are available from the MiniApps sidebar. Chats, completed app versions, and filter/input state survive reloads through localStorage.

## Run

Requires Node.js 20.19+ or 22.12+, an OpenAI-compatible provider key, and an OpenUI gateway key with access to the selected model and script execution.

**Release prerequisite:** this example depends on the generalized generation/renderer and dashboard-library updates in OpenUI PRs #1268 and #1292, including `createToolExecutor`. Until those packages are published and the dependency pins updated, use the local development setup in [DEVELOPMENT.md](./DEVELOPMENT.md). The current registry pins are the existing starter versions; they do not yet include all MiniApps APIs. This stacked example must remain a draft until fresh-install verification passes with their releases.

```bash
pnpm install --ignore-workspace
cp .env.example .env.local
# Fill OPENAI_API_KEY and OPENUI_API_KEY.
pnpm dev
```

The example is registered for CLI scaffolding after it lands and the required packages are published:

```bash
npx @openuidev/cli@latest create my-miniapps --example miniapps
```

`npm install` / `npm run dev` and Bun work too. The `--ignore-workspace` flag is only needed when installing inside the OpenUI repository.

| Environment variable             | Purpose                                                                |
| -------------------------------- | ---------------------------------------------------------------------- |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Main agent credentials and model                                       |
| `OPENAI_BASE_URL`                | Optional OpenAI-compatible provider URL                                |
| `OPENUI_API_KEY`, `OPENUI_MODEL` | MiniApp generation and script execution                                |
| `OPENUI_API_BASE_URL`            | Optional gateway origin; defaults to the hosted OpenUI endpoint        |
| `GITHUB_TOKEN`                   | Optional GitHub token for higher rate limits or permitted repositories |

All keys remain on the server. No generated responses or tool results are hardcoded. Tool `output` examples describe the expected result shape; the running app fetches actual source data.

## Try it

- Choose **Compare npm downloads** or **Explore GitHub activity**. Open the preview while generation is running to watch the UI arrive.
- Change the period or source page. The custom query loader should remain visible until data arrives.
- With an app open, ask “Remove the detail table and make the chart larger.” This creates a new version of that app. Explicitly asking for a new dashboard creates a separate app.
- Reload, reopen a thread, or use the MiniApps sidebar. Completed versions and saved inputs remain available.
- Ask for a copy-summary button to exercise the browser-only clipboard tool alongside server data queries.

Generation must finish successfully before a new version is saved. A failed or cancelled edit leaves the previous completed version available. Loading data is separate from generating the app: an app can finish generation and subsequently display a data error. Retry data errors rather than requesting another generated app.

## Key files

| File                            | Change it to…                                                         |
| ------------------------------- | --------------------------------------------------------------------- |
| `src/app/page.tsx`              | Configure AgentInterface, starter prompts, transport, and persistence |
| `src/lib/storage.ts`            | Replace browser persistence with your own storage adapter             |
| `src/lib/artifact-renderer.tsx` | Customize previews, app rendering, query loaders, or frontend tools   |
| `src/server/agent.ts`           | Change the main agent's instructions or tool selection                |
| `src/server/builder.ts`         | Configure generation, editing, models, and app-specific instructions  |
| `src/server/tools.ts`           | Describe and implement server tools                                   |
| `src/lib/dashboard-library.ts`  | Select a different MiniApp component library                          |
| `src/app/api/tools/route.ts`    | Expose tool execution to your frontend                                |

The browser sends the selected app and its complete previous response for editing. The generator's completed response becomes the new saved version. Pass the complete response to `Renderer`; the application does not split scripts from UI or apply patches itself.

AgentInterface already supplies inline previews and the detailed-view portal, so the artifact content uses `Renderer`. Outside AgentInterface, use `Renderer` for inline content or `WithPreviewRenderer` when you want its preview pattern.

Examples and clear tool descriptions help the model choose appropriate components, bindings, and calculations. The builder uses the dashboard library's exported prompt options. Add examples of your own desired layouts, interactions, units, and missing-data behavior when adapting this example.

## Verify

```bash
pnpm verify
```

Verification generates both library specs, runs lint, and builds the production app without calling a model. See [DEVELOPMENT.md](./DEVELOPMENT.md) for local package/backend setup and the manual testing checklist.

This is a single-user development example. localStorage belongs to one browser origin; it is not a shared database, identity system, or secure store for private data. Before public deployment, add your application's authentication, authorization, and rate limits to both API routes. Scope stored apps and tool access to the authenticated user, and replace browser-supplied edit history with records loaded from trusted server storage when that boundary matters.
