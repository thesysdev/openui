---
"@openuidev/lang-core": patch
---

The library's JSON schema now defines each `tagSchemaId`-named prop type (e.g. the dashboard's `Format`, `GoodWhen`) once in `$defs` and `$ref`s it, instead of inlining it in every prop. The schema is smaller and means the same thing: the parser validates values through these `$ref`s exactly as before.
