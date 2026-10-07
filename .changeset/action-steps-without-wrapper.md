---
"@openuidev/lang-core": minor
"@openuidev/react-lang": patch
"@openuidev/react-ui": patch
---

Action steps are plans. Every step call now evaluates to a one-step plan (`{ steps: [step] }`), so a single step needs no wrapper: `Button("Ask", @ToAssistant("Tell me more"))`. Several steps still need `Action([...])`, for example `Button("Save", Action([@Set($saved, true), @ToAssistant("Saved")]))`; a plain list of steps stays a plain array. An invalid step evaluates to an empty plan (a no-op) instead of null, and `Action([...])` flattens nested plans. Legacy `{ type, params }` action configs are unchanged.

New `action()` helper (lang-core, re-exported by react-lang), like `reactive()`: it returns the action prop schema, already tagged `ActionExpression`, so libraries write `action: action().optional()` instead of calling `tagSchemaId(..., "ActionExpression")` themselves. react-ui's action props use it; their JSON schema is unchanged.

Prompt change: for libraries with action props (`ActionExpression`), the system prompt teaches one step bare and several steps in `Action([...])`. The react-ui prompt examples, including the chat library examples, use step calls instead of legacy objects.
