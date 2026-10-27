---
"@openuidev/cli": patch
"@openuidev/lang-core": patch
---

The CLI and lang-core now read and write the shared `~/.config/openui/telemetry.json` through one module. The file is written atomically and only when something in it changed, so the two packages no longer overwrite each other's fields ([#1475](https://github.com/thesysdev/openui/pull/1475)).
