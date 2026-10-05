---
"@openuidev/lang-core": minor
"@openuidev/react-ui": patch
---

Action props no longer need the `Action([...])` wrapper. A single step such as `Button("Ask", @ToAssistant("Tell me more"))` and a plain list such as `Button("Save", [@Set($saved, true), @ToAssistant("Saved")])` both work. Every step call now evaluates to a one-step plan (`{ steps: [step] }`), an invalid step evaluates to an empty plan (a no-op) instead of null, and `Action([...])` still works and flattens nested plans. A non-empty list becomes a plan only when every item is a step, so ordinary arrays stay data; this works for any action prop schema. Legacy `{ type, params }` action configs are unchanged.

Prompt change: for libraries with action props (`ActionExpression`), the system prompt now teaches the single-step and list forms and mentions `Action([...])` only as also accepted. The react-ui prompt examples, including the chat library examples, use step calls instead of legacy objects.
