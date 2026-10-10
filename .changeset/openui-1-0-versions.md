---
"@openuidev/lang-core": major
"@openuidev/react-lang": major
"@openuidev/vue-lang": minor
"@openuidev/svelte-lang": minor
"@openuidev/angular-lang": minor
"@openuidev/a2ui": minor
"@openuidev/react-ui": minor
"@openuidev/devtools": minor
"@openuidev/assistant-ui": minor
"@openuidev/react-email": minor
---

OpenUI Lang 1.0.

- Upgrade `@openuidev/lang-core` and `@openuidev/react-lang` together, and together with the server that generates the system prompt. A 1.0 prompt teaches bare action steps (`@ToAssistant("Hi")` without `Action([...])`), which a 0.x client does not run.
- react-ui 0.18 requires react-lang 1.0 (peer `>=1.0.0 <2.0.0`); upgrade them together.
- A program whose `root` statement is written last shows nothing while it streams, until the `root` line arrives. Write `root` first, as the system prompt asks.
- A cut-off output that never reached its `root` statement now renders blank instead of a partial tree.
