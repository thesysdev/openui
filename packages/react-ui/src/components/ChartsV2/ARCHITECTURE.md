# ChartsV2 Architecture

> Auto-maintained by architect agent. Last updated: 2026-03-18 (rev 4)

## Overview

ChartsV2 is a D3-based charting system within OpenUI's React component library. It provides 7 chart types across 3 topologies (cartesian-scrollable, cartesian-condensed, and polar). D3 is used strictly for math (scales, path generation, stacking); React owns the DOM via JSX. The system replaces the original Recharts-based `Charts/` package.

The design follows a **hook-orchestrated architecture**: each chart delegates all shared state management (data, dimensions, hover, scroll, legend, tooltip) to a single "orchestrator" hook, then supplies only chart-specific rendering (series geometry, crosshairs, axis variant).

## System Diagram

```
                            ChartsV2/index.ts (public API)
                                     |
              +----------+-----------+-----------+----------+----------+
              |          |           |           |          |          |
         D3AreaChart D3BarChart D3LineChart D3PieChart D3RadialChart D3RadarChart D3ScatterChart
              |          |           |           |          |          |               |
              |    Cartesian (X/Y)  |     Polar (categorical)     Polar (radar)   Scatter
              |__________|___________|           |__________|          |               |
                         |                            |               |               |
             +-----------+----------+      +----------+       +-------+       +-------+
             |                      |      |                  |               |
   useChartScrollable    useChartCondensed  useCategorical    useRadarChart   useScatterChart
   Orchestrator          Orchestrator       ChartOrchestrator Orchestrator    Orchestrator
             |                      |      |                  |               |
             +----------+-----------+      +-------+----------+               |
                        |                          |                          |
                  hooks/cartesian/           hooks/polar/               hooks/cartesian/
                        |                          |                          |
                  hooks/core/  <--- shared by all chart types ------>  hooks/core/
                        |
                  utils/ + types/
                        |
                  shared/core/       <--- all chart types
                  shared/cartesian/  <--- Area, Bar, Line, Scatter
```

### Data Flow (Cartesian Scrollable -- most complex path)

```
Props (data, categoryKey, theme, variant, stacked, ...)
  |
  v
[1] useChartScrollableOrchestrator
  |-- useChartData           --> dataKeys, colors, hiddenSeries, toggleSeries, legendItems, chartConfig, colorMap
  |-- useChartDimensions     --> containerWidth, yAxisWidth, xAxisHeight, chartInnerHeight, svgWidth, needsScroll
  |-- useChartHover          --> hoveredIndex, mousePos, createMouseHandlers(findIndex)
  |-- useChartScroll         --> canScrollLeft, canScrollRight, handleScroll, scrollTo
  |-- useTooltipPayload      --> tooltipPayload | null
  |
  v
[2] Chart-specific hooks (in the chart component, not the orchestrator)
  |-- useXScale / useXBandScale   --> xScale (D3 ScalePoint or ScaleBand)
  |-- useYScale                    --> yScale (D3 ScaleLinear)
  |-- useStackedData               --> stackedData | null (D3 stack generator)
  |
  v
[3] ScrollableChartLayout (shared layout component)
  |-- YAxis (separate fixed SVG)
  |-- Scrollable container with main SVG
  |   |-- Grid (horizontal lines from yScale.ticks())
  |   |-- [Chart-specific Series] renders SVG paths/rects using scales
  |   |-- [Chart-specific Crosshair/Hover indicator]
  |   |-- XAxis (foreignObject labels from scale.domain())
  |-- ScrollButtonsHorizontal (snap navigation)
  |-- DefaultLegend (expand/collapse, series toggle)
  |-- ChartTooltip (portal via @floating-ui, positioned at mouse viewport coords)
```

## Module Map

| Module                         | Responsibility                                                                              | Key Dependencies               |
| ------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------ |
| `types/common.ts`              | Base types: `ChartData`, `BaseChartProps`, `LegendItem`, `XAxisTickVariant`                 | paletteUtils (PaletteName)     |
| `utils/dataUtils.ts`           | Extract data keys, build chart config, legend items, color lookup                           | types                          |
| `utils/paletteUtils.ts`        | 6 color palettes (11 colors each), `useChartPalette` hook, color distribution               | ThemeProvider                  |
| `utils/mouseUtils.ts`          | `findNearestDataIndex` (point scale), `findBandIndex` (band scale)                          | d3-scale                       |
| `utils/scrollUtils.ts`         | Data width calculation, snap positions, density spacing                                     | --                             |
| `utils/styleUtils.ts`          | `numberTickFormatter` (K/M/B/T abbreviations), `measureYAxisWidth` (tick-based axis sizing) | --                             |
| `utils/polarUtils.ts`          | Polar helpers: sort, slice hover style, percentage format, radar angles                     | types                          |
| `utils/buildContainerStyle.ts` | Merge chart CSS vars with fixed width/height overrides                                      | --                             |
| `hooks/core/`                  | Coordinate-agnostic hooks shared by all chart types                                         | d3-selection, ThemeProvider    |
| `hooks/cartesian/`             | Cartesian-specific: orchestrators, scales, axes, scroll, stacking                           | d3-scale, d3-shape, core hooks |
| `hooks/polar/`                 | Polar-specific: categorical orchestrator, radar orchestrator, radar hover                   | core hooks                     |
| `shared/core/`                 | Topology-agnostic components used by all chart types: legend, tooltips, truncation hook     | @floating-ui, @radix-ui        |
| `shared/cartesian/`            | Cartesian-only components: axes, grid, clip, crosshair, layouts, scroll buttons, base SCSS  | @floating-ui, lucide-react     |
| `D3AreaChart/`                 | Area chart: gradient fills, stacked/unstacked, natural/linear/step curves                   | hooks, shared, d3-shape        |
| `D3BarChart/`                  | Bar chart: grouped/stacked, bar radius, internal line, band scale                           | hooks, shared, d3-scale        |
| `D3LineChart/`                 | Line chart: dot display, natural/linear/step curves                                         | hooks, shared, d3-shape        |
| `D3PieChart/`                  | Pie/donut chart: circular/semicircular, corner radius, padding angle                        | hooks, shared, d3-shape        |
| `D3RadialChart/`               | Radial bar chart: circular/semicircular, proportional arc bars                              | hooks, shared, d3-shape        |
| `D3RadarChart/`                | Radar chart: polygon/circle grid, multi-series overlay, axis labels                         | hooks, shared, d3-scale        |
| `D3ScatterChart/`              | Scatter plot: numeric X/Y, multi-dataset, 2D nearest-point hover                            | hooks, shared, d3-scale        |

## Hook Architecture

### Three-Layer Hook System

```
hooks/
  core/           -- coordinate-agnostic (all chart types)
    useChartData              -- multi-series data: keys, colors, hidden series, legend (delegates to useSeriesVisibility)
    useCategoricalChartData   -- single-series categorical: slices, totals, percentages
    useChartHover             -- hover state + createMouseHandlers factory (1D: mouseX)
    useContainerSize          -- ResizeObserver with fixed-size bypass
    useLegendHeight           -- ResizeObserver on legend element
    usePrintContext           -- matchMedia("print") detection
    useSeriesVisibility       -- toggle hidden series with "keep at least one" guard (shared by useChartData + scatter)
    useTooltipPayload         -- builds tooltip content from hovered row
    useTransformedKeys        -- stable tk-N IDs for CSS vars (ref-cached)
    useCanvasContextForLabelSize -- memoized canvas 2D context for text measurement (SSR-safe stub)

  cartesian/      -- X/Y charts only
    useChartScrollableOrchestrator  -- composes: data + dimensions + hover + scroll + tooltip
    useChartCondensedOrchestrator   -- composes: data + hover + tooltip (angled labels, no scroll)
    useScatterChartOrchestrator     -- composes: useSeriesVisibility + useChartPalette + measureYAxisWidth (numeric X/Y, 2D hover)
    useChartDimensions              -- all layout math: sizing, axis, scroll detection
    useChartScroll                  -- scroll state + snap navigation
    useXScale                       -- D3 scalePoint (area, line)
    useXBandScale                   -- D3 scaleBand (bar)
    useYScale                       -- D3 scaleLinear (all cartesian)
    useStackedData                  -- D3 stack generator (area stacked, bar stacked)
    useXAxisHeight                  -- canvas-based label height calculation (useMemo)
    useYAxisWidth                   -- Canvas measurement of tick width
    useMaxLabelWidth                -- Canvas measurement of category labels
    useAutoAngleCalculation         -- Trig-based label rotation for condensed mode

  polar/          -- Pie, Radial, Radar
    useCategoricalChartOrchestrator -- composes: categorical data + container + legend + hover
    useRadarChartOrchestrator       -- composes: chart data + radial scale + container + hover
    useRadarHover                   -- hover state + createMouseHandlers factory (2D: mouseX, mouseY)
```

### Orchestrator Pattern

Each orchestrator is a "mega-hook" that composes lower-level hooks and returns a structured result object with consistent sections:

```typescript
return {
  refs:       { containerRef, legendRef, [mainContainerRef] },
  identity:   { chartId },
  data:       { catKey, dataKeys, colorMap, chartConfig, ... },
  dimensions: { containerWidth, chartInnerHeight, totalHeight, ... },
  hover:      { hoveredIndex, mousePos, createMouseHandlers | handleMouseMove },
  scroll:     { canScrollLeft, canScrollRight, handleScroll, scrollTo }, // cartesian scrollable only
  legend:     { legendItems, hiddenSeries, toggleSeries, isLegendExpanded, setIsLegendExpanded },
  tooltip:    { tooltipPayload },
  style:      { containerStyle },
};
```

This pattern means chart components are thin -- they destructure the orchestrator result, create chart-specific scales, and pass everything to a shared layout component.

## Chart Classification

### Cartesian Charts (Area, Bar, Line)

Each has 3 files:

- `D3[Type]Chart.tsx` -- empty-state guard + condensed/scrollable routing
- `D3[Type]ChartCondensed.tsx` -- uses `useChartCondensedOrchestrator` + `CondensedChartLayout`
- `D3[Type]ChartScrollable.tsx` -- uses `useChartScrollableOrchestrator` + `ScrollableChartLayout`

The `condensed` prop (from `BaseChartProps`) selects the mode. Condensed mode fits all data in the container width with angled X-axis labels. Scrollable mode (default) uses fixed spacing per data point and enables horizontal scrolling when data overflows.

**Scale selection:**

- Area/Line use `useXScale` (ScalePoint) -- points centered within group width
- Bar uses `useXBandScale` (ScaleBand) -- discrete bands with padding

### Polar Charts (Pie, Radial)

Both use `useCategoricalChartOrchestrator` which wraps `useCategoricalChartData`. They share:

- Single-series data model (categoryKey + dataKey)
- Slice-based hover (per-element `onMouseMove`)
- Responsive sizing constrained to min/max chart size
- Semi-circular appearance option

Pie adds: D3 `pie()` + `arc()` generators, donut variant (inner radius), padding angle, corner radius.
Radial adds: proportional arc bars (each slice = one ring), radial grid.

### Radar Chart

Uses `useRadarChartOrchestrator` which wraps `useChartData` (multi-series aware). Unique because:

- Multi-series data on a polar coordinate system
- Polygon/circle grid with spokes
- Axis labels positioned by trigonometry
- 2D hover via `useRadarHover` (angle-based nearest-axis detection)

### Scatter Chart

Uses `useScatterChartOrchestrator` which composes shared hooks (`useSeriesVisibility`, `useChartPalette`, `useContainerSize`, `useLegendHeight`, `usePrintContext`, `useCanvasContextForLabelSize`) and the shared `measureYAxisWidth` utility. `D3ScatterChart` uses `forwardRef` + `displayName` per project convention, and renders shared components (`Grid`, `VerticalGrid`, `YAxis`, `DefaultLegend`, `ChartTooltip`). Unique because:

- Different data model: `ScatterDataset[]` with `{name, data: ScatterPoint[]}` (not `ChartData`)
- Numeric X and Y axes (both `scaleLinear`)
- 2D nearest-point hover with snap radius (30px)
- Vertical + horizontal grid (both `Grid` and `VerticalGrid` from `shared/cartesian/`)
- Does not extend `BaseChartProps` -- has its own props interface
- No condensed/scrollable bifurcation (the continuous-axis nature means all data always fits)

## Shared Component Architecture

### Topology-Tiered Directory Layout

`shared/` is organized into tiers that mirror the `hooks/` core/cartesian/polar pattern:

```
shared/
  core/                        -- used by ALL chart types
    DefaultLegend/             -- expand/collapse legend with series toggle
    LabelTooltip/              -- Radix tooltip for truncated axis labels
    PortalTooltip/             -- @floating-ui portal tooltip for chart data
    useIsTruncated.ts          -- ResizeObserver-based text truncation detection
  cartesian/                   -- used by Area, Bar, Line (+ Scatter for Grid/YAxis)
    axes/                      -- XAxis, AngledXAxis, XAxisLabel, YAxis
    layouts/                   -- ScrollableChartLayout, CondensedChartLayout
    ScrollButtonsHorizontal/   -- snap-scroll navigation arrows
    ClipDefs.tsx               -- SVG clip-path definitions
    Grid.tsx                   -- horizontal grid lines from yScale
    VerticalGrid.tsx           -- vertical grid lines from xScale (linear, used by scatter)
    LineDotCrosshair.tsx       -- hover crosshair + active dot (line/area)
    chartBase.scss             -- SCSS mixins (chart-base, crosshair-styles)
  index.ts                     -- barrel re-exports from both tiers
```

A `shared/polar/` tier should be created when the first reusable polar component appears that is shared by 2+ polar chart types.

### Placement Rules for shared/ Components

| Condition                                        | Location                                   |
| ------------------------------------------------ | ------------------------------------------ |
| Used by all chart topologies (cartesian + polar) | `shared/core/`                             |
| Used by 2+ cartesian charts only                 | `shared/cartesian/`                        |
| Used by 2+ polar charts only                     | `shared/polar/` (create when first needed) |
| Crosses topologies but not all                   | `shared/core/` (err toward core)           |
| Used by exactly 1 chart                          | That chart's `parts/` directory            |

Components graduate from `parts/` to `shared/` when a second chart needs them. They never start in `shared/`.

### Layout Components

`ScrollableChartLayout` and `CondensedChartLayout` (in `shared/cartesian/layouts/`) are the two rendering templates for cartesian charts. They accept:

- The orchestrator result (typed as `ReturnType<typeof useChart[Scrollable|Condensed]Orchestrator>`)
- A yScale for the Y-axis
- Mouse handlers (created from `orch.hover.createMouseHandlers`)
- Slot props: `defs`, `series`, `xAxis` (chart-specific SVG content)

This slot-based approach lets charts inject their unique SVG elements while sharing all layout, axes, grid, legend, and tooltip rendering.

### Tooltip System

Two tooltip mechanisms:

1. **ChartTooltip** -- portal-based data tooltip using `@floating-ui/react-dom`. Positioned via virtual element at viewport coordinates. Truncates to 5 items if >10, with "Click to view all" message. Portals to `document.body` with theme class.
2. **LabelTooltip** -- Radix UI tooltip for truncated axis labels. Wraps the chart root in `LabelTooltipProvider`.

### Legend System

`DefaultLegend` is a `forwardRef` + `memo` component that:

- Measures available width to determine how many items fit in one row
- Shows "N more" toggle button when items overflow
- Supports expand/collapse state
- Dims hidden series (opacity 0.3)
- Displays optional X/Y axis labels below the legend

Uses `useDefaultLegend` hook for intelligent width-based item fitting via canvas text measurement.

## Styling Architecture

### SCSS Mixin System

`shared/cartesian/chartBase.scss` provides two SCSS mixins:

- `chart-base($prefix)` -- generates container, inner, Y-axis container, main container, grid, and tick styles for a given chart prefix
- `crosshair-styles($prefix)` -- generates crosshair line and active dot styles

Each cartesian chart SCSS file includes these mixins:

```scss
@use "../shared/cartesian/chartBase" as base;
@include base.chart-base("area-chart");
@include base.crosshair-styles("area-chart");
```

### CSS Class Convention

All classes follow `openui-d3-{chart-type}-{element}` naming:

- `openui-d3-area-chart-container`
- `openui-d3-bar-chart-hover-highlight`
- `openui-d3-line-chart-line--animated`

Shared components use `openui-chart-{component}`:

- `openui-chart-legend-container`
- `openui-chart-tooltip`
- `openui-portal-tooltip`

### Animation

Each chart type defines its own CSS animations:

- **Area/Line**: stroke-dasharray draw (`openui-d3-draw-line`) + area fade-in
- **Bar**: scaleY grow from bottom (`openui-d3-bar-grow`)
- **Pie**: scale + fade (`openui-d3-pie-appear`)
- **Radial/Radar**: fade (`openui-d3-radial-bar-appear`, `openui-d3-radar-polygon-appear`)
- **Scatter**: dot appear (`openui-d3-scatter-dot-appear`)

All animations respect `isAnimationActive` prop and `usePrintContext` (disabled during print).

### Design Token Usage

All SCSS files use `cssUtils` tokens (per OpenUI convention):

- Colors: `cssUtils.$text-neutral-primary`, `cssUtils.$border-default`, `cssUtils.$foreground`
- Spacing: `cssUtils.$space-m`, `cssUtils.$space-xs`
- Typography: `@include cssUtils.typography(label, extra-small)`
- Radius: `cssUtils.$radius-l`, `cssUtils.$radius-2xs`
- Shadow: `cssUtils.$shadow-s`

Exception: `paletteUtils.ts` defines chart-specific color palettes as hex values (not design tokens), since they are data visualization colors rather than UI chrome.

## Type System

### Data Models

```
ChartData = Array<Record<string, string | number>>    -- cartesian + radar + pie + radial

ScatterDataset = { name: string; data: ScatterPoint[] }  -- scatter only
ScatterPoint = { x: number; y: number; [key]: string | number | undefined }
D3ScatterChartData = ScatterDataset[]
```

### Props Hierarchy

```
BaseChartProps<T>                              -- shared by Area, Bar, Line
  |-- data, categoryKey, theme, customPalette
  |-- tickVariant, grid, legend, icons
  |-- isAnimationActive, showYAxis
  |-- xAxisLabel, yAxisLabel, className
  |-- height, width, fitLegendInHeight
  |-- condensed, density
  |
  +-- D3AreaChartProps<T>  extends BaseChartProps  + variant, stacked, onClick
  +-- D3BarChartProps<T>   extends BaseChartProps  + variant, barRadius, maxBarWidth, internalLine*, onClick
  +-- D3LineChartProps<T>  extends BaseChartProps  + variant, showDots, dotRadius, onClick

D3PieChartProps<T>         -- independent (single-series: categoryKey + dataKey)
D3RadialChartProps<T>      -- independent (single-series: categoryKey + dataKey)
D3RadarChartProps<T>       -- independent (multi-series: categoryKey, no dataKey)
D3ScatterChartProps         -- independent (dataset array, no categoryKey)
```

## Dependency Rules

### Allowed Imports

```
D3[Chart]/          --> hooks/, shared/core/, shared/cartesian/, utils/, types/
hooks/cartesian/    --> hooks/core/, utils/, types/
hooks/polar/        --> hooks/core/, utils/, types/, shared/core/PortalTooltip (for TooltipItem type)
hooks/core/         --> utils/, types/, ThemeProvider
shared/core/        --> utils/, types/, ThemeProvider, hooks/ (for type inference only)
shared/cartesian/   --> shared/core/, utils/, types/, ThemeProvider, hooks/ (for type inference only)
shared/polar/       --> shared/core/, utils/, types/, ThemeProvider, hooks/ (for type inference only)
utils/              --> types/, ThemeProvider (paletteUtils only)
types/              --> utils/ (PaletteName only)
```

**Tier rule**: `shared/cartesian/` may import from `shared/core/` but never the reverse. `shared/core/` must remain topology-agnostic.

### Forbidden Imports

- No chart type imports another chart type
- No ChartsV2 file imports from the legacy `Charts/` directory
- No hook imports a component (except type-only imports for ReturnType inference)
- `hooks/core/` must not import from `hooks/cartesian/` or `hooks/polar/`

## Design Patterns

### 1. Orchestrator + Slot Layout

The primary composition pattern. Orchestrators handle all shared state; layout components provide the DOM structure with slots for chart-specific SVG content.

### 2. Factory-Based Mouse Handlers

`useChartHover.createMouseHandlers(findIndex)` is a factory that accepts a chart-specific index-finding function. This decouples hover mechanics from scale type:

- Area/Line pass `(mouseX) => findNearestDataIndex(xScale, mouseX)` (nearest point)
- Bar passes `(mouseX) => findBandIndex(xScale, mouseX)` (band position)
- Radar passes `(mouseX, mouseY) => angleBasedIndex(mouseX, mouseY)` (2D angle)

### 3. Canvas-Based Text Measurement (SSR-Safe)

All text measurement hooks (`useXAxisHeight`, `useYAxisWidth`, `useMaxLabelWidth`, `useDefaultLegend`) use a shared `useCanvasContextForLabelSize` hook that creates a memoized `CanvasRenderingContext2D` configured with the theme font. In SSR environments (`typeof document === "undefined"`), it returns a typed stub with zero-width `measureText()` but a valid `font` string, so font-parsing logic (e.g., `parseLineHeight`) still produces correct line-height values on the server. This avoids DOM measurement overhead for text sizing and eliminates layout thrashing.

### 4. Condensed/Scrollable Bifurcation

Each cartesian chart has a single entry point that routes to either a Condensed or Scrollable sub-component based on the `condensed` prop. The two modes use different orchestrators, different X-axis components (AngledXAxis vs XAxis), and different layout components.

### 5. Series Visibility Toggle

The shared `useSeriesVisibility` hook (in `hooks/core/`) implements a "must keep at least one visible" constraint: `if (next.size >= seriesKeys.length - 1) return prev`. This is consumed by:

- `useChartData` (multi-series cartesian + radar) -- delegates visibility to `useSeriesVisibility`
- `useScatterChartOrchestrator` -- calls `useSeriesVisibility` directly
- `useCategoricalChartData` (single-series pie/radial) -- has its own inline implementation (single-series model differs)

## Architectural Strengths

1. **Strong separation of concerns**: D3 for math, React for DOM, CSS for animation. No `d3.select().append()` fighting React's virtual DOM.

2. **High code reuse via orchestrators**: Adding a new cartesian chart requires only ~100 lines of chart-specific code; the orchestrator handles 80% of the logic.

3. **Consistent API surface**: All cartesian charts share `BaseChartProps`. Legend, tooltip, and hover behavior are identical across charts.

4. **Progressive enhancement**: CSS `transition` on SVG `d` attribute works in modern browsers; gracefully degrades to instant updates in older ones.

5. **Responsive by default**: `useContainerSize` with ResizeObserver + automatic scroll/condensed adaptation.

6. **Print-aware**: `usePrintContext` disables all animations during print, ensuring static output.

7. **Shared layout components**: `ScrollableChartLayout` and `CondensedChartLayout` (in `shared/cartesian/layouts/`) eliminate layout code duplication across 3 chart types.

8. **Topology-tiered shared/**: The `shared/core/` + `shared/cartesian/` split mirrors the hook tier system, making it clear which components are topology-agnostic and preventing accidental coupling between cartesian and polar concerns.

## Architectural Weaknesses and Risks

### 1. Scatter Chart Structural Differences (Low Risk -- Largely Resolved)

`D3ScatterChart` now shares core infrastructure with other chart types (`useSeriesVisibility`, `useChartPalette`, `measureYAxisWidth`, shared `Grid`/`VerticalGrid`/`YAxis`/`DefaultLegend`/`ChartTooltip` components, `forwardRef` + `displayName`). Remaining differences are justified by the fundamentally different data model:

- Does not extend `BaseChartProps` (scatter uses `ScatterDataset[]`, not `ChartData` with `categoryKey`)
- No condensed/scrollable bifurcation (continuous-axis data always fits without scrolling)
- Tooltip construction is inline (2 items: X/Y values, not N series values per row)

The ThemeProvider palette bypass bug is resolved -- scatter now routes through `useChartPalette`.

### 2. Orchestrator Return Type Coupling (Low Risk)

`CondensedChartLayout` and `ScrollableChartLayout` type their `orch` prop as `ReturnType<typeof useChartCondensedOrchestrator>` / `ReturnType<typeof useChartScrollableOrchestrator>`. This creates tight coupling between the layout components and the exact shape of the orchestrator return value. Any change to the orchestrator return shape requires updating the layout component and all chart components simultaneously.

### 3. Color Palette Hardcoded Hex Values (Low Risk)

`paletteUtils.ts` defines all palette colors as hex strings rather than oklch/CSS custom properties. This means chart data colors do not participate in the ThemeProvider's oklch color system. The `useChartPalette` hook does check `theme[themePaletteName]` first (allowing theme-level override), so this is mitigated for users who provide custom palettes via ThemeProvider.

### 4. No Unit Tests (High Risk)

The ChartsV2 directory has no test files. All validation is via Storybook visual testing only. The hooks contain significant logic (dimension calculation, scale construction, hover detection, scroll state) that would benefit from unit tests. The utility functions (`scrollUtils`, `mouseUtils`, `dataUtils`, `polarUtils`) are pure functions and trivially testable.

### 5. Missing Accessibility (Medium Risk)

Charts have `role="img"` and `aria-label` on the SVG element, but:

- No keyboard navigation for data points
- No screen reader announcements for hover/tooltip content
- Legend items are clickable divs without `role="button"` or keyboard handlers
- No ARIA live region for dynamic tooltip content
