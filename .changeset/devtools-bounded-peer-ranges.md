---
"@openuidev/devtools": minor
---

Internal peer dependencies now declare bounded tested-compatibility ranges:
`@openuidev/react-lang` requires `">=0.3.0 <0.4.0"`. Minor (breaking) rather
than patch on purpose: react-lang 0.2.x depends on devtools with `^0.1.0`, so
a 0.1.x release would be pulled into existing react-lang 0.2.x installs and
fail them with an unsatisfiable peer. Bumping to 0.2.0 keeps old react-lang
paired with old devtools; react-lang >=0.3.0 picks up the new line.
