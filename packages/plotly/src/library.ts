import { createLibrary } from "@openuidev/react-lang";

import { Callout, Card, CardHeader, Heading, KPI, Stack, Text } from "./layout/Layout";

// Tier 0/2 — escape hatches
import { Figure } from "./figure/Figure";
import { PlotlyJSON } from "./figure/PlotlyJSON";

// Tier 1 — Cartesian
import { Area } from "./traces/Area";
import { Bar } from "./traces/Bar";
import { Histogram } from "./traces/Histogram";
import { Line } from "./traces/Line";
import { Scatter } from "./traces/Scatter";

// Tier 1 — Distributions
import { Box } from "./traces/Box";
import { Violin } from "./traces/Violin";

// Tier 1 — Matrix & 2D-density
import { Contour } from "./traces/Contour";
import { Heatmap } from "./traces/Heatmap";
import { Histogram2D } from "./traces/Histogram2D";
import { Histogram2DContour } from "./traces/Histogram2DContour";

// Tier 1 — Hierarchical
import { Icicle } from "./traces/Icicle";
import { Sunburst } from "./traces/Sunburst";
import { Treemap } from "./traces/Treemap";

// Tier 1 — Categorical / proportions
import { Funnel } from "./traces/Funnel";
import { FunnelArea } from "./traces/FunnelArea";
import { Donut, Pie } from "./traces/Pie";
import { Waterfall } from "./traces/Waterfall";

// Tier 1 — Flow
import { Sankey } from "./traces/Sankey";

// Tier 1 — Multivariate
import { ParCats } from "./traces/ParCats";
import { ParCoords } from "./traces/ParCoords";
import { ScatterMatrix } from "./traces/ScatterMatrix";

// Tier 1 — Financial
import { Candlestick } from "./traces/Candlestick";
import { OHLC } from "./traces/OHLC";

// Tier 1 — Polar
import { BarPolar } from "./traces/BarPolar";
import { ScatterPolar } from "./traces/ScatterPolar";

// Tier 1 — Specialty coordinates
import { ScatterSmith } from "./traces/ScatterSmith";
import { ScatterTernary } from "./traces/ScatterTernary";

// Carpet / ScatterCarpet / ContourCarpet are intentionally NOT registered as
// Tier-1 components. They only render when a Carpet trace and a Carpet-overlay
// trace coexist in the SAME figure — a constraint the openui-lang call site
// can't express because each defineComponent invocation produces its own Plot.
// Users who want carpet plots should compose them via Figure(...).

// Tier 1 — WebGL
import { ScatterGL } from "./traces/ScatterGL";
import { ScatterPolarGL } from "./traces/ScatterPolarGL";

// Tier 1 — Geo (cartesian projection only — tile-based map traces are gated
// behind a future `@openuidev/plotly/geo` sub-entry because maplibre-gl's CSS
// breaks Turbopack HMR.)
import { Choropleth } from "./traces/Choropleth";
import { ScatterGeo } from "./traces/ScatterGeo";
// import { ChoroplethMap } from "./traces/ChoroplethMap";
// import { ScatterMap } from "./traces/ScatterMap";
// import { DensityMap } from "./traces/DensityMap";

// Tier 1 — 3D
import { Cone } from "./traces/Cone";
import { Isosurface } from "./traces/Isosurface";
import { Mesh3D } from "./traces/Mesh3D";
import { Scatter3D } from "./traces/Scatter3D";
import { StreamTube } from "./traces/StreamTube";
import { Surface } from "./traces/Surface";
import { Volume } from "./traces/Volume";

// Tier 1 — Data display
import { Indicator } from "./traces/Indicator";
// Image trace disabled — plotly's image helpers require `buffer/` which doesn't
// resolve under Next.js 16 + Turbopack. Re-enable when Plotly drops the polyfill
// or when a Turbopack alias for `buffer/` becomes possible.
import { Table } from "./traces/Table";

export const plotlyComponentGroups = [
  {
    name: "Layout",
    components: ["Stack", "Card", "CardHeader", "Heading", "Text", "Callout", "KPI"],
    notes: [
      "- Wrap each chart in a Card with a CardHeader for a titled section.",
      '- Use Stack(direction="row", wrap=true) to lay charts side-by-side; Stack defaults to vertical.',
      "- Use KPI for big-number metrics; Heading for dashboard titles; Callout for findings.",
    ],
  },
  {
    name: "Cartesian",
    components: ["Bar", "Line", "Scatter", "Area", "Histogram"],
    notes: [
      "- Two ways to pass data:",
      "  • Express style: `data` is row objects, `x`/`y`/`color` are field names. Bar(rows, 'month', 'revenue', 'product').",
      "  • Graph-Objects style: `data` is null, `x`/`y`/`color` are parallel arrays. Bar(null, ['Jan','Feb'], [120, 150]).",
      "- For grouped bars use barmode='group' (default); 'stack' to stack.",
    ],
  },
  {
    name: "Distributions",
    components: ["Histogram", "Violin", "Box"],
    notes: [
      "- One-variable distribution: Histogram(rows, 'value', nbinsx?, color?).",
      "- Compare across groups: Violin (shape) or Box (summary).",
      "- Violin overlays a box plot by default — pass showBox=false to hide.",
    ],
  },
  {
    name: "Matrix & 2D-density",
    components: ["Heatmap", "Histogram2D", "Histogram2DContour", "Contour"],
    notes: [
      "- Heatmap(z, x?, y?, colormap?) for a labeled matrix.",
      "- Histogram2D / Histogram2DContour for density of a 2D scatter.",
      "- Contour for a continuous scalar field z (rows×cols).",
      "- colormap defaults to 'viridis'. Use a diverging map ('RdBu', 'BrBG', 'PiYG', 'spectral') only when zero is meaningful.",
    ],
  },
  {
    name: "Hierarchical",
    components: ["Sunburst", "Treemap", "Icicle"],
    notes: [
      "- All three take parallel arrays: ids, parents (root parent is empty string ''), values, optional labels.",
      "- Sunburst: radial; Treemap: rectangular; Icicle: rectangular like Treemap but stacked along an orientation.",
    ],
  },
  {
    name: "Categorical / proportions",
    components: ["Pie", "Donut", "Funnel", "FunnelArea", "Waterfall"],
    notes: [
      "- Pie / Donut: parallel `values` and `labels`.",
      "- Funnel: stages + values, with auto-computed conversion percentages.",
      "- FunnelArea: triangular ribbon-style funnel.",
      "- Waterfall: running totals with up/down deltas — `measure` per step ('relative'|'total'|'absolute').",
    ],
  },
  {
    name: "Flow",
    components: ["Sankey"],
    notes: [
      "- Sankey takes nodes ([{id, label?, color?}]) and links ([{source, target, value}]) with ids referencing nodes.",
    ],
  },
  {
    name: "Multivariate",
    components: ["ScatterMatrix", "ParCoords", "ParCats"],
    notes: [
      "- ScatterMatrix(rows, ['feature1','feature2','feature3'], color?) — pair plot.",
      "- ParCoords for numeric multi-dimension comparison; ParCats for categorical multi-dimension flow.",
      "- All three accept a row-objects `data` array + `dimensions` field names.",
    ],
  },
  {
    name: "Financial",
    components: ["Candlestick", "OHLC"],
    notes: [
      "- Candlestick(x, open, high, low, close) — parallel arrays. OHLC has the same shape with a denser bar style.",
      "- Pass showRangeSlider=true on Candlestick for a range slider.",
    ],
  },
  {
    name: "Polar",
    components: ["ScatterPolar", "BarPolar"],
    notes: [
      "- ScatterPolar(r, theta, mode?) — also makes radar plots when fill='toself'.",
      "- BarPolar(r, theta, width?) — wind-rose style.",
      "- thetaUnit defaults to 'degrees'; pass 'radians' to switch.",
    ],
  },
  {
    name: "Specialty coordinates",
    components: ["ScatterTernary", "ScatterSmith"],
    notes: [
      "- ScatterTernary: compositions in a triangle (chemistry, soil, mineralogy).",
      "- ScatterSmith: complex impedance (RF/microwave engineering).",
      "- For carpet plots (curvilinear grids with ScatterCarpet/ContourCarpet overlays), use Figure with the full Plotly trace JSON — they only render when the carpet and overlay traces coexist in one figure.",
    ],
  },
  {
    name: "WebGL accelerated",
    components: ["ScatterGL", "ScatterPolarGL"],
    notes: ["- Use these instead of Scatter / ScatterPolar when you have >10k points. Same API."],
  },
  {
    name: "Geo",
    components: ["Choropleth", "ScatterGeo"],
    notes: [
      "- Choropleth: country / state region shading using Plotly's natural-earth projection.",
      "- ScatterGeo: points / great-circle paths on a globe.",
      "- locationmode for Choropleth: 'ISO-3' (default), 'USA-states', 'country names', 'geojson-id'.",
    ],
  },
  {
    name: "3D",
    components: ["Scatter3D", "Surface", "Mesh3D", "Cone", "StreamTube", "Isosurface", "Volume"],
    notes: [
      "- All 3D charts open with full mouse rotate/pan/zoom.",
      "- Scatter3D for points/lines; Surface for z=f(x,y); Mesh3D for arbitrary point clouds.",
      "- Cone / StreamTube for vector fields (x,y,z,u,v,w).",
      "- Isosurface / Volume for 3D scalar fields (x,y,z,value).",
    ],
  },
  {
    name: "Data display",
    components: ["Indicator", "Table"],
    notes: [
      "- Indicator: KPI alternative — `mode`: 'number' | 'delta' | 'gauge' | combinations. For deltas pass `reference`; for gauges pass `rangeMin`/`rangeMax`.",
      "- Table is COLUMN-oriented — `values` is an array of columns where each column is an array of cells.",
    ],
  },
  {
    name: "Advanced (escape hatches)",
    components: ["Figure", "PlotlyJSON"],
    notes: [
      "- Figure({ data: [...traces], layout: {...} }) for any composition the typed components don't cover (multi-trace overlays, subplots, dual axes, animation frames, custom polar shapes, …). Use full Plotly Graph-Objects schema.",
      "- PlotlyJSON({ figure }) renders a Plotly figure JSON object verbatim — useful when a backend tool returns a precomputed figure (e.g. Python `fig.to_json()`).",
    ],
  },
];

export const plotlyExamples = [
  `Example — Bar chart (Express style):

root = Card([CardHeader("Q4 revenue"), b])
b = Bar(rows, "month", "revenue", "product", null, "group", null, "month", "revenue ($)")
rows = [
  {month: "Oct", revenue: 1200, product: "A"},
  {month: "Oct", revenue: 980,  product: "B"},
  {month: "Nov", revenue: 1500, product: "A"},
  {month: "Nov", revenue: 1100, product: "B"},
  {month: "Dec", revenue: 1800, product: "A"},
  {month: "Dec", revenue: 1400, product: "B"}
]`,

  `Example — Histogram and Violin in two cards:

root = Stack([h1, row])
h1 = Heading("Latency analysis", "h1")
row = Stack([histCard, violCard], "row", 12, true)
histCard = Card([CardHeader("Distribution"), hist])
violCard = Card([CardHeader("By region"), viol])
hist = Histogram(null, latencies, null, 30, null, null, "Latency", "ms", "Count")
viol = Violin(rows, "region", "latency_ms", null, true, "all")
latencies = [120, 135, 142, 158, 175, 195, 220, 245, 280, 310]
rows = [{region:"US", latency_ms: 120}, {region:"EU", latency_ms: 195}, {region:"APAC", latency_ms: 280}]`,

  `Example — Correlation heatmap (diverging colormap):

root = Card([CardHeader("Feature correlations"), hm])
hm = Heatmap(matrix, features, features, "RdBu", -1, 1, true, ".2f", "Correlation (Pearson r)")
features = ["sepal_len", "sepal_wid", "petal_len", "petal_wid"]
matrix = [
  [1.00, -0.12, 0.87, 0.82],
  [-0.12, 1.00, -0.43, -0.36],
  [0.87, -0.43, 1.00, 0.96],
  [0.82, -0.36, 0.96, 1.00]
]`,

  `Example — Sankey funnel:

root = Card([CardHeader("User funnel"), s])
s = Sankey(nodes, links, "Q4 conversion", 360)
nodes = [{id:"visit", label:"Visit"}, {id:"signup", label:"Sign up"}, {id:"trial", label:"Trial"}, {id:"paid", label:"Paid"}]
links = [{source:"visit", target:"signup", value:1200}, {source:"signup", target:"trial", value:480}, {source:"trial", target:"paid", value:140}]`,

  `Example — Sunburst hierarchy:

root = Sunburst(ids, parents, values, labels, "remainder", null, "Engineering org")
ids = ["eng", "eng-platform", "eng-product", "eng-platform-data", "eng-platform-infra", "eng-product-web", "eng-product-mobile"]
parents = ["", "eng", "eng", "eng-platform", "eng-platform", "eng-product", "eng-product"]
values = [0, 0, 0, 14, 9, 22, 11]
labels = ["Engineering", "Platform", "Product", "Data", "Infra", "Web", "Mobile"]`,

  `Example — KPI dashboard:

root = Stack([head, kpiRow, chart])
head = Heading("Q4 dashboard", "h1")
kpiRow = Stack([k1, k2, k3], "row", 12)
k1 = KPI("Active users", "48,120", "+8.4%", "up")
k2 = KPI("Conversion", "3.84%", "-0.2pp", "down")
k3 = KPI("Net revenue", "$1.26M", "+12.4%", "up")
chart = Card([CardHeader("Revenue by month"), Bar(rows, "month", "revenue")])
rows = [{month:"Oct", revenue:1200000}, {month:"Nov", revenue:1500000}, {month:"Dec", revenue:1800000}]`,

  `Example — escape hatch via Figure (polar wind-rose with multiple traces):

root = Card([CardHeader("Polar wind rose"), poly])
poly = Figure([t1, t2], {polar: {radialaxis: {ticksuffix: " mph"}}}, null, 360)
t1 = {type: "barpolar", r: [77, 32, 11, 5], theta: ["N", "E", "S", "W"], width: [80, 80, 80, 80], marker: {color: "#4c78a8"}, name: "Calm"}
t2 = {type: "barpolar", r: [44, 18, 6, 3],  theta: ["N", "E", "S", "W"], width: [80, 80, 80, 80], marker: {color: "#f58518"}, name: "Windy"}`,
];

export const plotlyAdditionalRules = [
  "Hard limit: do not emit more than ~25 chart components in a single response. Comprehensive tours quickly exceed the parser's reference budget and produce broken charts. If the user asks for 'all components', give them 5–8 representative ones plus a sentence offering to render any specific type on request.",
  "Never emit a chart whose data is purely a placeholder reference (e.g. `Bar(rows, 'x', 'y')` where `rows` is undefined). EVERY chart component in your output MUST be paired with a concrete `rows = [...]` or `arr = [...]` definition that resolves locally — otherwise the chart will render as 'No data'.",
  "If the user asks 'what can you do?' or similar capability questions, prefer Markdown / Text describing the catalog over rendering empty cards. Render actual charts only when there's data.",
  "Express style is preferred when the data is naturally row-oriented (each object is a row). Pass `data` as the array of objects and use field names for `x`, `y`, `color`. The LLM should NOT pre-flatten data into parallel arrays unless the user already provided data that way.",
  "Graph-Objects style (data=null, x/y as raw arrays) is fine for small literal datasets and pasted columns.",
  "Always wrap each chart in a Card with a CardHeader carrying a concise title. Use the chart's xLabel/yLabel for axis units (e.g. 'response (mV)').",
  "Use diverging colormaps ('RdBu', 'BrBG', 'PiYG', 'spectral') ONLY when zero is a meaningful midpoint (correlations, log fold-change). For ordinal/quantitative data without a special zero, prefer perceptually uniform sequential maps: 'viridis' (default), 'inferno', 'plasma', 'magma', 'cividis', 'turbo'.",
  "When the user has raw samples per group, prefer Violin or Box. When they have summary stats already (mean ± sd), prefer Bar with explicit error bars via Figure.",
  "For any chart the typed components don't cover (multi-trace overlays, subplots, dual axes, animation frames, custom polar/ternary layouts, advanced 3D scenes, custom hovertemplates), use Figure with full Plotly trace + layout JSON.",
  "Pair charts with a short prose interpretation in Text or a Callout when reporting a finding.",
  "Sunburst/Treemap/Icicle parents arrays: the root node MUST have an empty string '' as its parent.",
  "Sankey link source/target are NODE IDS, not indices. The renderer translates to indices.",
  "For >10k points use ScatterGL / ScatterPolarGL instead of Scatter / ScatterPolar.",
  "Choropleth with country data: `locationmode='ISO-3'` and 3-letter ISO codes (USA, FRA, JPN). For US states use 'USA-states' and two-letter codes (CA, TX, NY).",
];

export const plotlyPromptOptions = {
  examples: plotlyExamples,
  additionalRules: plotlyAdditionalRules,
};

export const plotlyLibrary = createLibrary({
  root: "Stack",
  componentGroups: plotlyComponentGroups,
  components: [
    // Layout
    Stack,
    Card,
    CardHeader,
    Heading,
    Text,
    Callout,
    KPI,
    // Cartesian
    Bar,
    Line,
    Scatter,
    Area,
    Histogram,
    // Distributions
    Violin,
    Box,
    // Matrix / 2D density
    Heatmap,
    Histogram2D,
    Histogram2DContour,
    Contour,
    // Hierarchical
    Sunburst,
    Treemap,
    Icicle,
    // Categorical / proportions
    Pie,
    Donut,
    Funnel,
    FunnelArea,
    Waterfall,
    // Flow
    Sankey,
    // Multivariate
    ScatterMatrix,
    ParCoords,
    ParCats,
    // Financial
    Candlestick,
    OHLC,
    // Polar
    ScatterPolar,
    BarPolar,
    // Specialty coords
    ScatterTernary,
    ScatterSmith,
    // WebGL
    ScatterGL,
    ScatterPolarGL,
    // Geo (cartesian projection only — tile-map traces gated behind future sub-entry)
    Choropleth,
    ScatterGeo,
    // 3D
    Scatter3D,
    Surface,
    Mesh3D,
    Cone,
    StreamTube,
    Isosurface,
    Volume,
    // Data display
    Indicator,
    Table,
    // Advanced
    Figure,
    PlotlyJSON,
  ],
});

export type PlotlyLibrary = typeof plotlyLibrary;
