# @openuidev/cli

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
