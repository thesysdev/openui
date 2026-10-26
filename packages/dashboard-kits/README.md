# @openuidev/dashboard-kits

Dashboard kits for OpenUI. A kit is everything a model needs to build dashboards for one domain on top of a base dashboard library:

- **components**, placed into the base cards;
- a **prompt**: preamble, definitions, rules, and worked gallery dashboards;
- a **data contract**: read-only tools with zod input and output schemas, called with `Query()`;
- **sample data**: tool handlers over one coherent demo business.

Two kits ship today:

- **e-commerce**: Sundial Goods, modeled on Shopify, Triple Whale, and GA4;
- **product analytics**: Relay's team looking at its own product, modeled on PostHog, Amplitude, and Mixpanel;

## Entry points

| Import                                 | Side   | What it has                                                                                                 |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| `@openuidev/dashboard-kits`            | client | The shared blocks (openui-lang definitions and plain React views), `createKitLibrary`, `createToolProvider` |
| `@openuidev/dashboard-kits/ecommerce`  | client | `createEcommerceLibrary(base)` and the e-commerce components                                                |
| `@openuidev/dashboard-kits/analytics`  | client | `createAnalyticsLibrary(base)` and the product analytics components                                         |
| `@openuidev/dashboard-kits/server`     | server | Kit definitions, tool contracts, sample-data handlers, `buildSystemPrompt`, `runTool`. No React             |
| `@openuidev/dashboard-kits/styles.css` | —      | The kit theme (light and dark) and every component's styles                                                 |

## Use

```tsx
// Client: a kit library is a base dashboard library plus the kit's components.
import { createEcommerceLibrary } from "@openuidev/dashboard-kits/ecommerce";
import { createToolProvider } from "@openuidev/dashboard-kits";
import { ecommerceKit } from "@openuidev/dashboard-kits/server";
import { dashboardLibrary } from "@openuidev/thesys";
import "@openuidev/react-ui/components.css";
import "@openuidev/dashboard-kits/styles.css";

const library = createEcommerceLibrary(dashboardLibrary);

<div className="kit-theme" data-mode="light">
  <Renderer library={library} response={program} toolProvider={createToolProvider(ecommerceKit)} />
</div>;
```

The kits render in the OpenUI design system: wrap them in react-ui's `ThemeProvider`, and every kit colour, font, radius, and status colour reads its `--openui-*` token, so light and dark mode and any theme override apply to the kits as they do to the base dashboard. Chart series take the theme's chart palette (`lineChartPalette`, `barChartPalette`, `pieChartPalette`, else `defaultChartPalette`, else OpenUI's Ocean ramp), distributed the way react-ui's charts distribute it.

```ts
// Server: prompt assembly and tool execution against the sample data.
import {
  buildSystemPrompt,
  ecommerceKit,
  runTool,
  SAMPLE_HANDLERS,
} from "@openuidev/dashboard-kits/server";
import spec from "./ecommerce.spec.json"; // openui generate <library file> --spec

const prompt = buildSystemPrompt(ecommerceKit, spec);
const result = runTool(ecommerceKit, "get_store_kpis", { range: "30d" }, SAMPLE_HANDLERS.ecommerce);
```

The base library is passed in, so the kits do not depend on one dashboard implementation. `createToolProvider` posts each `Query()` to `/api/tools/<kit>/<tool>` by default; the example app in `examples/miscellaneous/dashboard-kits` has the matching route.

## Layout

The package follows react-ui's structure: plain React components with typed props, and thin openui-lang definitions over them.

```
src/
  index.ts ecommerce.ts analytics.ts server.ts   the public entry points
  core/                  kit contract, prompt assembly, schemas, formats, stats, tool provider,
                         metric definitions, and the why math (explain.ts)
    library/             createKitLibrary, row balancing, and the list of shared definitions
    hooks/  test/        shared hooks (container size, chart hover, series focus, palette); test helpers
  blocks/                one folder per shared block: its React component, its openui-lang
                         definition (<Block>.definition.tsx), styles, and tests
    KpiStrip/ HeroMetric/ InsightList/ ConversionFunnel/ CohortGrid/ BarList/ ShareBar/ DataStatus/ …
    KitLayer/            the page-level layer popups draw on, so cards can't clip them
  charts/                one folder per d3 chart, the same pattern: TrendChart/ ColumnChart/ HeatGrid/
                         GoalPace/ Tracker/ Sparkline/ ProfitWaterfall/ QuadrantChart/ SegmentFlow/ …
    shared/ utils/       tooltip, legend, crosshair, series geometry, spring (ported from react-ui); scales
  ecommerce/             the e-commerce kit: kit.ts (prompt and gallery), library.ts, tools.ts, metrics.ts,
                         data/ (the sample store by topic; handlers.ts for the tools), blocks/ (one file each)
  analytics/             the product analytics kit, the same shape, plus its tested models
                         (population, moments, workspaces, experiments, revenue, alerts)
  theme/                 theme tokens and base styles (index.scss compiles to dist/styles.css)
```

**Every chart is the kit's own, on d3.** `ColumnChart` (grouped, or stacked from zero with negative values below; the lifecycle chart, power user curve, and MRR movements use it), `HeatGrid` (the activity heatmap), the `ShareBar`, the period-over-period `TrendChart` (shaded gap, events, goal lines and benchmark bands, in-progress tail; lines far from zero fit their range, areas keep zero), `GoalPace`, `Tracker`, the KPI `Sparkline`, `ProfitWaterfall`, `SegmentFlow`, `QuadrantChart`, `SixTwelve`, and `BurnDown` all share one interaction model — a gliding hover follower and the shared tooltip, a legend that brings a series forward on hover and pins it on click, arrow keys — and react-ui's architecture: a hook-free empty-state dispatcher, an implementation with parts, d3 scales and d3-shape curves (react-ui's "natural" monotone curve), pure geometry with unit tests, react-ui's motion (a spring data morph so data changes glide, mounted hover followers so the crosshair, dots, and tooltip glide between points, and draw-on entrances), and a stylesheet per chart under the `kit` class prefix. Charts measure before their first paint and snap on resize, so only data changes animate.

Where a react-ui chart was close but not a fit, the kit keeps its own:

| Kit chart          | Closest react-ui chart       | Why the kit keeps its own                                                                                                                                       |
| ------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Sparkline`        | `MiniAreaChart`              | `MiniAreaChart` keeps one point per 20px, so an 84px cell shows 5 of 30 days, and its range starts at zero, which flattens a KPI that moves between 40K and 45K |
| `ConversionFunnel` | `FunnelChart`                | The kit funnel shows what continues and drops off between steps, the median time between them, and the change against the prior period                          |
| `QuadrantChart`    | `ScatterChart`               | The quadrants need split lines, quadrant names, bubble sizes, and a label per point                                                                             |
| `GoalPace` gauge   | `RadialChart` (semicircular) | The gauge marks where the pace says the month should be                                                                                                         |
| `TrendChart`       | `LineChart`, `AreaChart`     | The trend needs the prior period, the shaded gap, events, goal lines, benchmark bands, and the in-progress last point                                           |

## Develop

```sh
pnpm --filter @openuidev/dashboard-kits build
pnpm --filter @openuidev/dashboard-kits test
pnpm --filter @openuidev/dashboard-kits lint:check
```

`examples/miscellaneous/dashboard-kits` is the playground: `npm run kits:pack` there builds this package, packs it, and installs it.
