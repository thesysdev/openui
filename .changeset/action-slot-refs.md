---
"@openuidev/lang-core": minor
"@openuidev/react-lang": patch
---

Action slots are JSON Schema `$ref`s, like component slots. An action prop is `{"$ref": "#/$defs/ActionExpression"}`, and the library's `$defs` has `ActionExpression` with the same legacy object union as before. A slot can name specific steps with refs, for example `share: z.union([steps.ToAssistant.ref, steps.OpenUrl.ref]).optional()` (lang-core, re-exported by react-lang): the JSON gets `ToAssistant` and `OpenUrl` `$defs`, and the prompt signature prints `share?: @ToAssistant | @OpenUrl`. These refs only shape the prompt and the JSON for now; the runtime accepts any step in them. Action `$defs` are never components.
