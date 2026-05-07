# @openuidev/plotly

Plotly.js component library for OpenUI's generative UI runtime. An LLM speaking openui-lang gets **47 typed chart components** — bar, line, heatmap, violin, sankey, sunburst, candlestick, scatter3d, choropleth, parallel coordinates, the rest of Plotly's catalog — plus a `<PlotlyChat />` wrapper that drops onto any "use client" page.

## Install

```bash
pnpm add @openuidev/plotly @openuidev/react-ui @openuidev/react-headless @openuidev/react-lang react react-dom zod
```

## Quick start

```tsx
"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";
import "@openuidev/plotly/styles.css";

import { PlotlyChat } from "@openuidev/plotly";

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <PlotlyChat />
    </div>
  );
}
```

Pair with an `/api/chat` proxy that streams from your LLM provider (see `examples/` for a working OpenAI implementation).

## Two-tier API

Following Plotly's own dual API:

**Tier 1** — Typed Plotly-Express-style components. Small zod schemas, ergonomic for the LLM:

```
Bar(rows, "month", "revenue", "product")               # Express style
Bar(null, ["Jan", "Feb", "Mar"], [1.2, 1.5, 1.8])      # Graph-Objects style
```

**Tier 2** — `Figure(data, layout)` accepts the full Plotly Graph-Objects schema. Use this for charts Tier 1 doesn't cover (multi-trace overlays, dual axes, animation frames, custom polar/ternary/carpet, advanced 3D scenes).

**Tier 0** — `PlotlyJSON({ figure })` renders a fully-formed Plotly figure JSON verbatim. Bridge for backend-produced figures (Python `fig.to_json()`).

## Component catalog

| Family | Components |
|---|---|
| Layout | `Stack`, `Card`, `CardHeader`, `Heading`, `Text`, `Callout`, `KPI` |
| Cartesian | `Bar`, `Line`, `Scatter`, `Area`, `Histogram` |
| Distributions | `Violin`, `Box` |
| Matrix & 2D-density | `Heatmap`, `Histogram2D`, `Histogram2DContour`, `Contour` |
| Hierarchical | `Sunburst`, `Treemap`, `Icicle` |
| Categorical | `Pie`, `Donut`, `Funnel`, `FunnelArea`, `Waterfall` |
| Flow | `Sankey` |
| Multivariate | `ScatterMatrix`, `ParCoords`, `ParCats` |
| Financial | `Candlestick`, `OHLC` |
| Polar | `ScatterPolar`, `BarPolar` |
| Specialty coords | `ScatterTernary`, `ScatterSmith` |
| Geo | `Choropleth`, `ScatterGeo` |
| Data display | `Indicator`, `Table` |
| Escape hatches | `Figure`, `PlotlyJSON` |

The LLM sees these via the auto-generated system prompt — no manual Plotly schema authoring required.

## Bidirectional reactivity

Plotly events flow into OpenUI's action system:

```
Bar(rows, "month", "revenue",
    onClick=Action([@Set($selectedMonth, event.x), @Run(monthlyDetail)]))
```

Supported events: `onClick`, `onSelected` (lasso/box select), `onRelayout` (zoom/pan).

## Bundle & loading

- The Plotly bundle (~3.5 MB minified, ~1 MB gzipped) is loaded **lazily via `React.lazy`** on first chart render. The chat shell first paint is unaffected.
- Chart instances mount only after the assistant message finishes streaming — avoids token-by-token flicker as the LLM populates trace shape.

## Custom chat shell

If `<PlotlyChat />` is too restrictive, drop down to the lower-level pieces:

```tsx
import { Renderer, useTriggerAction } from "@openuidev/react-lang";
import { FullScreen } from "@openuidev/react-ui";
import {
  plotlyLibrary,
  plotlyPromptOptions,
  PlotlyAssistantMessage,
} from "@openuidev/plotly";

const systemPrompt = plotlyLibrary.prompt(plotlyPromptOptions);
// …compose your own FullScreen / processMessage / assistantMessage…
```

## Theming

`lightTemplate` + `darkTemplate` are exported as plain Plotly `Layout` objects matching OpenUI's design language. Apply them to your own (non-OpenUI) Plotly charts elsewhere if you want consistent visuals.

## Limitations

- **`image` trace** is not registered in the default bundle. Plotly's image source does `require('buffer/').Buffer` (with the trailing slash, deliberately), which Turbopack can't resolve. Use `Figure` with custom Plotly registration to enable it in non-Turbopack environments.
- **Carpet family** (`Carpet`, `ScatterCarpet`, `ContourCarpet`) is figure-only — they only render when composed in a single figure, which separate `defineComponent` calls can't express. Use `<Figure />`.

## License

MIT
