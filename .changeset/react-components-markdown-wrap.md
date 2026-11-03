---
"@openuidev/react-components": patch
---

`MarkDownRenderer` breaks long text with no spaces, such as a comma-separated list, a URL or an id, at its container's edge instead of letting it overflow (`overflow-wrap: break-word`). Tables keep their natural width.
