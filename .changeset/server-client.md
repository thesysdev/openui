---
"@openuidev/server": minor
---

Add a root createClient factory with default THESYS_API_KEY lookup and shared Gateway configuration. Expose provider-independent completed-text fix as openUIClient.autofix.fix({ library, generation }) and existing streaming helpers under openUIClient.openai.completions.autofix and openUIClient.vercel.ai.autofix. Keep Completions persistence under openUIClient.openai.completions.conversations.appendMessages.

Retain all existing standalone APIs and provider entry points with their signatures and behavior. Library specs are supplied per operation and cached by object identity.
