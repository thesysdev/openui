---
"@openuidev/lang-core": patch
---

`toJSONSchema()` now writes each `tagSchemaId`-named prop type once in `$defs` and refers to it with `$ref`, instead of repeating it in every prop. The schema is smaller and means the same; validation and prompts are unchanged. A name that is already used, or is not a plain identifier, falls back to writing the type out in place.
