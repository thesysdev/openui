# OpenUI examples

These projects showcase what OpenUI can do with different runtimes, application frameworks, design systems, coding harnesses, and specialized libraries. They are standalone reference implementations, not starter templates; use the [OpenUI CLI](https://www.openui.com/docs/agent/getting-started/quickstart) to scaffold a new application.

Each example has one primary home based on the integration seam it is intended to teach. Cross-cutting technologies belong in that example's README rather than in duplicate directory trees.

## Categories

| Category                                 | Use it for                                                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`agent-frameworks`](./agent-frameworks) | Agent runtimes and orchestration frameworks that produce or stream OpenUI output                                  |
| [`app-frameworks`](./app-frameworks)     | Application frameworks or platforms that host an OpenUI client or server                                          |
| [`design-systems`](./design-systems)     | Component systems adapted into an OpenUI component library                                                        |
| [`harnesses`](./harnesses)               | Coding-agent harnesses presented through an OpenUI interface                                                      |
| [`miscellaneous`](./miscellaneous)       | Distinct capabilities, specialized libraries, and backend services that do not justify another top-level category |

`miscellaneous` is intentionally flat. If several examples develop the same stable integration seam, promote that seam to a top-level category instead of adding nested miscellaneous taxonomies.

## Catalog

### Agent frameworks

| Example                                           | Demonstrates                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| [Google ADK](./agent-frameworks/google-adk)       | A Google ADK TypeScript agent streaming OpenUI Lang to a Next.js client |
| [LangGraph Platform](./agent-frameworks/langgraph-platform) | A DeepAgents graph on LangGraph Platform, streamed to OpenUI through the LangChain adapter |
| [Mastra](./agent-frameworks/mastra)               | A Mastra agent connected to OpenUI through AG-UI                        |
| [Vercel AI SDK](./agent-frameworks/vercel-ai-sdk) | AgentInterface over a Vercel AI SDK `streamText` backend              |
| [Vercel Eve](./agent-frameworks/vercel-eve)       | An Eve agent rendered through Agent Interface                           |

### App frameworks

| Example                                       | Demonstrates                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| [FastAPI](./app-frameworks/fastapi)           | A Python FastAPI streaming backend with a React OpenUI client                   |
| [React Native](./app-frameworks/react-native) | An Expo client rendering native OpenUI components from a Next.js backend stream |
| [Svelte](./app-frameworks/svelte)             | OpenUI Lang parsing and rendering in SvelteKit                                  |
| [Vue](./app-frameworks/vue)                   | OpenUI Lang parsing and rendering in Nuxt and Vue                               |

### Design systems

| Example                                     | Demonstrates                                                   |
| ------------------------------------------- | -------------------------------------------------------------- |
| [Material UI](./design-systems/material-ui) | A broad Material UI component library for generated interfaces |
| [shadcn/ui](./design-systems/shadcn)        | A broad shadcn/ui component library for generated interfaces   |

### Harnesses

| Example                              | Demonstrates                                                    |
| ------------------------------------ | --------------------------------------------------------------- |
| [Grok Build](./harnesses/grok-build) | Grok Build coding sessions and tool activity in Agent Interface |
| [Pi](./harnesses/pi)                 | A Pi coding-agent session streamed into Agent Interface         |

### Miscellaneous

| Example                                        | Demonstrates                                                         |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| [Handsontable](./miscellaneous/handsontable)   | Generated spreadsheet interfaces backed by Handsontable              |
| [HTML artifact](./miscellaneous/html-artifact) | Sandboxed HTML artifacts as an OpenUI capability                     |
| [React Email](./miscellaneous/react-email)     | Generating and previewing emails with the OpenUI React Email library |
| [Supabase](./miscellaneous/supabase)           | Persisted OpenUI conversations and threads with Supabase             |

## Run and verify

Every JavaScript application under `examples/` is standalone: it has its own manifest, dependencies, scripts, and canonical pnpm lockfile. Installing the repository root does not install any example dependencies.

Enter the application directory you want to run, then use your preferred package manager:

```bash
pnpm install --ignore-workspace
# or: npm install
# or: bun install
```

The pnpm flag prevents the command from climbing to this repository's ancestor workspace; it is not needed after copying an example elsewhere. The scripts do not invoke pnpm internally, so the corresponding `pnpm dev`, `npm run dev`, and `bun run dev` commands are equivalent. FastAPI's JavaScript application is in `app-frameworks/fastapi/frontend`; React Native has separate applications in `app-frameworks/react-native/backend` and `app-frameworks/react-native/chat-app`.

Repository maintainers can install every application from the repository root with:

```bash
pnpm examples:install
```

Follow an example's README for its environment variables and development command. From any example directory, run its credential-free verification contract with:

```bash
pnpm verify
# or: npm run verify
# or: bun run verify
```

To verify all examples sequentially against the pinned published OpenUI packages, run:

```bash
pnpm examples:verify
```

Examples that use static system prompts generate them locally before `dev`, `build`, and `verify`. Generated prompt and spec files are ignored by Git and should not be committed.

All `@openuidev/*` dependencies are exact published versions rather than links to packages in this repository. The manually triggered `Update example OpenUI packages` workflow updates them together, refreshes every application's `pnpm-lock.yaml`, verifies every example, and opens or updates one pull request when versions change.

pnpm lockfiles are the reproducibility contract for repository CI; npm and Bun users can generate their native local lockfiles, which are ignored under `examples/` to avoid maintaining three lock formats for every application.

## Maintenance contract

Every retained example should:

- showcase a distinct OpenUI capability or maintained integration;
- remain runnable without depending on another example;
- document its purpose, stack, prerequisites, run command, architecture, key files, verification command, and extension points;
- expose a credential-free `verify` script that checks the example's relevant build, types, and local tests;
- generate derived prompts and specs locally rather than store them in the repository;
- depend on exact published `@openuidev/*` versions rather than root workspace packages;
- use a normalized `@openuidev/example-*` package name and keep repository links current.

Delete examples that duplicate an authoritative CLI template, are maintained elsewhere, substantially overlap a stronger example, or no longer justify their maintenance cost.
