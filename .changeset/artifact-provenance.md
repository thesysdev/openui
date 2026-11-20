---
"@openuidev/lang-core": minor
"@openuidev/react-lang": minor
"@openuidev/react-ui": minor
"@openuidev/dashboard-library": minor
---

Show where a live artifact's numbers come from. `LiveArtifactRenderer` takes `enableProvenance`: the bar gets an inspect toggle (`ProvenanceToggle`), a click on a component or a number while inspecting selects it instead of acting, and `Provenance` shows your panel for it. `useArtifactProvenance()` returns the selection and its sources: the query with its call and result, the cell a number shows, the formula in between, and its filters.

In lang-core, a component written inside a statement gets an id, `inlineId` (`lead.2`: the third component inside `lead`), and `dataSources` accepts it. It also returns `formulas` (the text of the statements in between) and, per prop, its `expr` and, for a plain read of one query, the `cell` it shows. In react-lang, components may receive `bindSource`, which marks their root element (`bindSource()`) and a prop's element (`bindSource("value")`); `readSourceTarget(element)` finds the component and prop under a click, also for components that don't call `bindSource`. `Renderer.DefaultContent` is what `Renderer` shows without children. In the dashboard library, `Kpi`, `Stat` and `Kpis` mark their value and comparison.
