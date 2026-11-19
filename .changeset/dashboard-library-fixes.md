---
"@openuidev/dashboard-library": patch
---

Cards keep what the reader set inside them (a table's sort and page, a chart's view) when a filter reloads the data. Filters and the Compare toggle now show the value their `$variable` really holds, with nothing selected when it has none, and stay reachable by keyboard in that case. A line chart ignores `stacked` instead of drawing off the plot, a Table's `groupBy` matches a column label whatever its case, a Section shows its description without a title, and the prompt text is corrected where it described these behaviours wrongly.
