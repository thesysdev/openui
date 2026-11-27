---
"@openuidev/react-email": patch
"@openuidev/react-ui": patch
---

Harden model-controlled markup and style values:

- `EmailMarkdown` now renders markdown to React elements with `react-markdown` instead of injecting HTML. Raw HTML in the content is dropped and `javascript:`-style link targets are removed, while headings, emphasis, links, lists and inline code keep their email styling.
- Email `backgroundColor`/`buttonColor` props only accept CSS color syntax (hex, named, `rgb()`/`hsl()`), falling back to the default color otherwise.
- `ImageBlock` builds its background image through `toCssUrl`, card-block `gap` only accepts CSS lengths, and `toCssUrl` escapes every control character.
