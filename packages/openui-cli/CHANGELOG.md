# @openuidev/cli

## 0.6.1

### Patch Changes

- [#1499](https://github.com/thesysdev/openui/pull/1499) [`6fbaf91`](https://github.com/thesysdev/openui/commit/6fbaf91fb31fa3ad4008718540ca2fe24eb4d60c) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - The CLI and lang-core now read and write the shared `~/.config/openui/telemetry.json` through one module. The file is written atomically and only when something in it changed, so the two packages no longer overwrite each other's fields ([#1475](https://github.com/thesysdev/openui/pull/1475)).

## 0.6.0

### Minor Changes

- [#1384](https://github.com/thesysdev/openui/pull/1384) [`da58df6`](https://github.com/thesysdev/openui/commit/da58df6a98b3a224e2f4cbae9557d48b296b970e) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - `create .` scaffolds into the current folder when it's empty, naming the project after the folder.

- [#1384](https://github.com/thesysdev/openui/pull/1384) [`da58df6`](https://github.com/thesysdev/openui/commit/da58df6a98b3a224e2f4cbae9557d48b296b970e) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Remove the agent-skill install step and `--skill` from `create`. New projects now get an `AGENTS.md` copied from the OpenUI skill; `--no-skill` leaves it out and suggests `npx skills add thesysdev/skills` instead. Agent runs point to the project README.

- [#1384](https://github.com/thesysdev/openui/pull/1384) [`da58df6`](https://github.com/thesysdev/openui/commit/da58df6a98b3a224e2f4cbae9557d48b296b970e) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Add `setup-agent`, which adds the OpenUI skill to an existing project's `AGENTS.md` (or creates it); rerun it to refresh.

### Patch Changes

- [#1384](https://github.com/thesysdev/openui/pull/1384) [`da58df6`](https://github.com/thesysdev/openui/commit/da58df6a98b3a224e2f4cbae9557d48b296b970e) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - `generate --spec` now includes the library file's `promptOptions` export in the spec.

## 0.5.3

### Patch Changes

- [#1411](https://github.com/thesysdev/openui/pull/1411) [`60ab506`](https://github.com/thesysdev/openui/commit/60ab506ce3edb552680fb231cc5b360d6ae16127) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Stop `create` from hanging or failing when a coding agent or a non-interactive shell runs it. Agents are detected from `--agent-name` or, via `@vercel/detect-agent` plus a few extra markers, from the environment their harness sets. With nobody to answer prompts, a plain `create` now takes the defaults (OpenUI Cloud template, LangGraph, `openui-agent` or the next free name) instead of erroring on a missing template arg, skips Cloud sign-in, and ends with a `generate-api-key` hint that uses the invoking package manager.

## 0.5.2

### Patch Changes

- [#1336](https://github.com/thesysdev/openui/pull/1336) [`adc0234`](https://github.com/thesysdev/openui/commit/adc023433e0ebfd4e1fd33a48b12ee8b2cace8bb) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Offer browser sign-in and API key generation when scaffolding OpenUI examples. Read the primary key and destination from the example catalog's nested `env` object, including backend `.env` files and `.env.local`, and preserve other environment settings.

- [#1342](https://github.com/thesysdev/openui/pull/1342) [`9aa0771`](https://github.com/thesysdev/openui/commit/9aa077167a9788fb5c053732f01d63bae0894ec4) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Let `create --example` scaffold from other `thesysdev` GitHub repositories, and add Open Intelligent UI to the example catalog.

## 0.5.1

### Patch Changes

- [#1322](https://github.com/thesysdev/openui/pull/1322) [`6fb4741`](https://github.com/thesysdev/openui/commit/6fb4741c261cafcefa012c962b00b3686756a4a3) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Make LangGraph the default starter using Chat Completions and remove the minimal OpenAI SDK template. Persist completed turns in Cloud starters with the published server package.

## 0.5.0

### Minor Changes

- [#1266](https://github.com/thesysdev/openui/pull/1266) [`17be496`](https://github.com/thesysdev/openui/commit/17be4966d31ac92b86a9670feeac5c48d08c1277) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Add `openui feedback` command for sending anonymous feedback.

## 0.4.1

### Patch Changes

- [#1223](https://github.com/thesysdev/openui/pull/1223) [`b7d6a72`](https://github.com/thesysdev/openui/commit/b7d6a72c4d49ca38b0292c19452b28eecd1aa0cc) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Add a preflight git check with per-OS install hints, retry network failures with backoff during source checkout, catalog fetch, and dependency installation, and record retry attempts in failure telemetry alongside a new `cli_network_retry` event.

## 0.4.0

### Minor Changes

- [#1174](https://github.com/thesysdev/openui/pull/1174) [`ac1176a`](https://github.com/thesysdev/openui/commit/ac1176a7fcfa52166ba2976b29b7af5e18435a63) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Internal restructure of the CLI: each command is a folder, shared process state is a `CliContext` passed top-down, and telemetry is a `Telemetry` class with typed per-command methods.

  `openui create --help` loads template and backend-framework names from the catalog (bundled keys if the fetch fails). `--template` and `--backend-framework` accept catalog keys only (`openui-cloud`, `openui-self-hosted`, `default`, `langgraph`, `vercel-ai-sdk`, `vercel-eve`); short names like `cloud` and `eve` no longer resolve. `--verbose` is a global flag, so it works before or after the command.

### Patch Changes

- [#1196](https://github.com/thesysdev/openui/pull/1196) [`e66b2e5`](https://github.com/thesysdev/openui/commit/e66b2e5f4e7d6927c8f17e3997ff1219bee54a12) Thanks [@AbhinRustagi](https://github.com/AbhinRustagi)! - Stop inferring required deploy API keys from project dependencies.
