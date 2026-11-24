---
"@openuidev/lang-core": minor
"@openuidev/react-lang": minor
"@openuidev/react-ui": minor
"@openuidev/dashboard-library": minor
"@openuidev/assistant-ui": patch
---

Show where a live artifact's numbers come from. `LiveArtifactRenderer` takes `enableProvenance`: the bar gets an inspect toggle (`ProvenanceToggle`), a click on a component or a number while inspecting selects it instead of acting, and `Provenance` shows your panel for it. By default it shows a Sources panel docked beside the dashboard, opened by the bar's "Sources" button: every query, and for a click its query, result and formula; pass `describeSource` to `Provenance` to name your tools, or children to use your own panel. `useArtifactProvenance()` returns the selection and the program's sources: each component's queries with their calls and results, the formula in between and its filters. Style inspect mode with `[data-openui-hover]`, `[data-openui-selected]` and `.openui-artifact-inspecting`.

In lang-core, a component written inside a statement gets an id, `componentId` (`lead.2`: the third component inside `lead`), and `dataSources` lists it. In react-lang, components may receive `bindSource`, which marks their root element (`bindSource()`) and a prop's element (`bindSource("value")`); `readSourceTarget(element)` finds the component and prop under a click, also for components that don't call `bindSource`. `useDataSources()` returns `DataSources`. `Renderer.DefaultContent` is what `Renderer` shows without children. In the dashboard library, `Kpi`, `Stat` and `Kpis` mark their value and comparison. `@openuidev/react-ui` now needs `@openuidev/react-lang` 1.2.0 or later, for these APIs: update both together (`pnpm add @openuidev/react-ui@^0.19 @openuidev/react-lang@^1.2`). `@openuidev/assistant-ui` accepts `@openuidev/react-ui` and `@openuidev/react-headless` 0.19.
