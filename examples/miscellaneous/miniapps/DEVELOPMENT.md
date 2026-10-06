# Developing the MiniApps example

## Local packages and backend

Install the example normally first to generate portable registry lockfiles. Then link locally built packages **only in `node_modules`**, keeping `package.json` and lockfiles unchanged. Use the renderer worktree's `lang-core`, `react-lang`, and `server`; use the dashboard-library worktree's `react-ui`. Build the packages before linking and rebuild them after source changes.

For each package, replace its installed `node_modules/@openuidev/<name>` symlink with a symlink to the relevant local `packages/<name>` directory. Use `react-headless` from the same checkout as React UI. Linked React packages must share a single React, react-lang, and react-headless instance; duplicate contexts can prevent dashboard hooks from seeing the renderer.

Set `OPENUI_API_BASE_URL` in ignored `.env.local` to your local Coda gateway origin. That gateway should use the generalized Muse worktree and a running sandbox-runner; Prolog and local infrastructure must be available for authentication. Use a key created through your local OpenUI/Composition instance. The main agent can continue using OpenAI, or use `OPENAI_BASE_URL` and its provider key.

Do not commit local URLs, keys, package links, generated specs, build output, or any temporary bundler aliases. The example's committed defaults remain suitable for copying with the CLI. Recheck the staged diff before committing. Once the prerequisite packages are released, update exact `@openuidev/*` pins, refresh both lockfiles, and verify a clean installation without links before merging this example.

## Add a server tool

1. Add its name, description, input JSON schema, and representative `output` value to `toolDefinitions` in `src/server/tools.ts`.
2. Add the handler under `createToolExecutor({ tools })`. Forward its AbortSignal to fetches and other cancellable work.
3. Describe the result's fields and limits clearly, including missing values, pagination, units, and dates. Supply helpful prompt examples when the shape or calculation is unusual.

The same executor handles registered server tools and generated scripts. Its script continuations can call only registered server handlers. A tool failure should throw an error; do not return fake data as a successful result.

## Add a frontend tool

Add its definition alongside the other generation tools, then handle its name inside the renderer's `toolProvider.callTool` dispatcher before forwarding to `/api/tools`. The clipboard action demonstrates this pattern. Mark browser actions as direct, user-triggered mutations in their descriptions; they cannot run inside a server script.

If you only need frontend tools, use a named function map in `toolProvider` instead. When `callTool` is present it receives all names, so choose frontend handlers inside that dispatcher rather than adding sibling named handlers.

## Adapt generation and editing

Change the agent's `builderTool` description and instructions to match your product. The builder receives the complete request as `prompt`. Pass all identifiers and supplied data the app needs. Change the selected library and prompt options for a different type of MiniApp, then regenerate the specs.

The host selects the target version. A null target creates a new app; an explicit missing ID fails instead of silently creating a new one. An edit supplies that version's entire saved response as `baseResponse`. Keep the last completed version when generation fails or is cancelled, and replace the displayed response with the returned version on success.

Keep `isStreaming` true for the entire builder run, including script generation. Avoid changing the renderer's React key on every response update. Save input state separately from generated text. Compose `Renderer.Root`, `Renderer.Content`, `Renderer.QueryLoading`, and `Renderer.QueryError` to customize data-fetching feedback. Put the content and loading overlay inside a positioned container, and keep source errors visible rather than treating placeholder values as fetched data.

## Manual checks

- Create an npm dashboard, open it while streaming, and confirm progressive UI and data loading.
- Switch periods quickly, including back to a previously loaded period. Confirm no stale loading state or old result overwrites the current selection.
- Create a GitHub dashboard. Confirm its page/window labels and partial-data notices, and distinguish issues from pull requests.
- Create from supplied records containing zeros and missing values. Confirm zeros count and missing values are not silently converted to zero.
- Edit the selected app: remove a table, change a chart, and rename it. Confirm new versions affect the selected app and the previous versions remain accessible.
- Cancel an edit or interrupt generation. Reload and confirm the last completed version remains available without a saved partial app.
- Change filters or inputs, close/reopen the preview, reload, and open it from the MiniApps browser. Confirm state survives.
- Request a summary-copy button and verify the browser action alongside server queries.
- Use an unavailable npm package or GitHub repository. Confirm a useful data error rather than misleading metrics. Restore the source and retry.
- Create a second thread and app. Confirm threads and selected edit targets do not mix. Delete a disposable test thread through the UI and confirm its apps are removed too.

Browser storage uses the `openui-miniapps-v1` key. It stores completed tool results as app versions and indexes the newest version for the MiniApps browser. It also stores input state by app ID. Storage quota/permission failures are shown in the UI; do not put credentials in these records.
