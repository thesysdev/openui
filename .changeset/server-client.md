---
"@openuidev/server": minor
---

Add a root createClient factory with default THESYS_API_KEY lookup and shared Gateway configuration. Expose provider-independent completed-text repair as client.autofix.fix({ library, response }) and existing streaming helpers under client.completions.autofix and client.vercel.ai.autofix. Keep Completions persistence under client.completions.conversations.appendMessages.

Retain all existing standalone APIs and provider entry points with their signatures and behavior. Library specs are supplied per operation and cached by object identity.
