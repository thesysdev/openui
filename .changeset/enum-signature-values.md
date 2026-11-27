---
"@openuidev/lang-core": patch
---

Prompt signatures list the values an enum accepts. A prop typed `z.enum(Size)` with a TypeScript enum, or `z.enum({ Small: "sm" })`, showed its keys (`"Small"`), while the parser only accepts the values (`"sm"`), so a model that followed the prompt got a `type-mismatch` error. A numeric TypeScript enum now shows `1 | 2` instead of `"1" | "2" | "Low" | "High"`.
