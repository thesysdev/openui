---
"@openuidev/react-components": patch
"@openuidev/react-ui": patch
"@openuidev/dashboard-library": patch
"@openuidev/intelligent-ui-library": patch
---

Use CSS logical start alignment (`text-align: start`, `justify-content: flex-start`, and `border-inline-end`) for default unaligned text blocks, table headers/cells, option cards, citations, follow-up items, and tooltips so RTL (`dir="rtl"`) interfaces align naturally to the inline start while keeping LTR rendering unchanged.
