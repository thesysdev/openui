---
"@openuidev/lang-core": minor
"@openuidev/react-lang": patch
"@openuidev/vue-lang": patch
"@openuidev/angular-lang": patch
"@openuidev/react-ui": patch
---

`@ToAssistant(message, context)` passes its context through unchanged as any value (object, array, number, string, including falsy ones). The `continue_conversation` step's `context` is now typed `unknown`, and react-lang, vue-lang and angular-lang forward it in `params.context` whenever it is set. The react-ui chat adds it as the third element of the chat context, and card item context merges into an object context as `selectedItem`. The system prompt documents the context argument.
