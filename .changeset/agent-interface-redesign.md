---
"@openuidev/react-ui": patch
"@openuidev/react-headless": patch
---

Refresh the AgentInterface shell: a collapsed sidebar rail with a History menu and a draggable, remembered width; a pill composer and a shared ~72ch reading column; a centred welcome screen with starter tabs and a `card` starter variant; a new `AgentInterface.ChatHeader` slot with chat title, Rename and Delete; a Rename option in the thread menu; a shared menu style for Select, ModelSwitcher and dropdowns; and a mascot loader in place of the dot-matrix loader. The headless chat store now caches messages of threads opened this session, so switching back to one shows it at once while a fresh copy loads.
