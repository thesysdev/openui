# Dashboard kits: design

The kits are in the `@openuidev/dashboard-kits` package (`packages/dashboard-kits`); this app is their playground.

## What a kit is

A kit is everything a model needs to build dashboards for one domain, on top of the dashboard artifact's base components. Each kit has four parts:

| Part          | What it is                                                                            | File                        |
| ------------- | ------------------------------------------------------------------------------------- | --------------------------- |
| Components    | The kit's own components, placed into the base cards                                  | `components/`, `library.ts` |
| Prompt        | A preamble that names the business, definitions, rules, and worked example dashboards | `kit.ts`                    |
| Data contract | Read-only tools with JSON Schema input and output, called with `Query()`              | `tools.ts`                  |
| Sample data   | Tool implementations over one coherent demo business                                  | `data/`                     |

A kit library has three layers:

1. **Base:** the dashboard artifact's 48 components (`Dashboard`, `Section`, `CardRow`, cards, charts, filters, tables).
2. **Shared analytics blocks**, which both kits use because every analytics product has them:
   - charts: `HeroMetric`, `TrendChart`, `ColumnChart`, `BarList`, `ShareBar`, and `GoalPace`;
   - blocks: `KpiStrip`, `InsightList`, `ConversionFunnel`, `CohortGrid`, and `Tracker`.
3. **Domain components:** six for e-commerce and nine for product analytics.

## What real dashboards show

The kits copy what the tools people already use show, with the same metric names and definitions:

| Pattern                                                                               | Seen in                                                                                 | Kit component                                      |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| KPI cards compared with the previous period, with sparklines                          | [Shopify analytics overview][shopify-overview]                                          | `KpiStrip`                                         |
| Total sales breakdown: gross sales, discounts, returns, net sales, shipping, taxes    | [Shopify finance reports][shopify-finance], [Lifetimely][lifetimely]                    | `MoneyBreakdown`                                   |
| Blended ROAS, MER, new-customer CPA (NCPA), net and contribution profit               | [Triple Whale summary metrics][triple-whale]                                            | `KpiStrip`, `ChannelPerformance`, `MoneyBreakdown` |
| Purchase journey and checkout journey with abandonment per step                       | [GA4 shopper journey reports][ga4-journeys]                                             | `ConversionFunnel`                                 |
| First-order cohorts by months since the first order, as cumulative LTV or repeat rate | [Shopify cohort analysis][shopify-cohorts]                                              | `CohortGrid`                                       |
| RFM segments (Champions, Loyal, At risk, Dormant…) with an action per segment         | [Shopify RFM analysis][shopify-rfm]                                                     | `CustomerSegments`                                 |
| Lifecycle: new, returning, resurrecting, and dormant users; quick ratio               | [PostHog lifecycle][posthog-lifecycle], [Amplitude growth accounting][amplitude-growth] | `LifecycleChart`                                   |
| Stickiness and the power user curve (days active out of 7 or 28)                      | [PostHog stickiness][posthog-stickiness], [Mixpanel power users][mixpanel-power]        | `PowerUserCurve`                                   |
| Feature engagement by breadth and frequency, in four quadrants                        | [Amplitude engagement matrix][amplitude-matrix]                                         | `EngagementMatrix`                                 |
| Experiment results: relative lift, 95% confidence interval, significance              | [Amplitude Experiment analysis][amplitude-experiment]                                   | `ExperimentResults`                                |

## The two kits

|                   | E-commerce                                                                                                                                                                                                                                                                                                                                                                                                                      | Product analytics                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Demo business     | Sundial Goods: a direct-to-consumer brand selling apparel, footwear, accessories, and home goods through its online store, app, and Amazon                                                                                                                                                                                                                                                                                      | Relay: a team workspace app with Free, Team, and Business plans on web, iOS, and Android                                                                                                                                                                                                                                                                                                         |
| Domain components | `MoneyBreakdown`, `ProfitWaterfall`, `ReconciliationCard`, `ChannelPerformance`, `CustomerSegments`, `SegmentFlow`, `ProductPerformance`, `ProductLeaderboard`, `ProductQuadrant`, `ExchangeMatrix`, `CreativeLeaderboard`, `InventoryAlerts`                                                                                                                                                                                   | `LifecycleChart`, `PowerUserCurve`, `EngagementMatrix`, `FeatureValue`, `FeatureAdoption`, `ActivityHeatmap`, `EventTable`, `UserPaths`, `ActivationMoments`, `ExperimentResults`, `AccountHealth`, `PaywallMatrix`, `CommitPacing`, `WeeklyReview`                                                                                                                                              |
| Tools (31 and 27) | KPIs, explain a change, sales over time, breakdown, and by dimension, marketing, attribution reconciliation, profit bridge, annotations, promotion impact, purchase, checkout, and order journeys, customer KPIs, new vs returning, customer flow, cohorts, RFM segments, products, inventory, returns, targets, live view, creatives, actions, sale plan, sales goal, fulfillment SLA, recent orders, orders by hour, insights | Usage KPIs, explain a change, data status, annotations, active users, lifecycle, activation funnel and moment, retention cohorts and curves, stickiness, feature engagement, activity heatmap, top events, user paths, signups by source, signup goal, experiments, account health and activity, revenue retention, monetisation, usage commits, weekly review, actions, alert preview, insights |
| Filters           | `$range`, `$compare` (previous period, last year, plan), `$channel`, `$category`, `$device`, `$customer`, attribution `$model`, `$promo`                                                                                                                                                                                                                                                                                        | `$range`, `$compare` (previous period, last year, plan), `$platform`, `$plan`, `$active` (core action or any event), retention mode and unit, experiment status, account plan and active rule, alert metric, drop, confirmation, quiet hours, and window                                                                                                                                         |
| Dashboards        | Store overview · What changed and why · Marketing and profit · Customers and retention · Targets and pacing · Monday summary · Live · Black Friday Cyber Monday · Promotions · Merchandising and checkout                                                                                                                                                                                                                       | Product health · What changed and why · Activation · Retention and lifecycle · Accounts and revenue · Features and experiments · Monetisation · Weekly review · Alert check                                                                                                                                                                                                                      |

The sample data tells a consistent story the insight tools pick up, so the dashboards have something real to show:

- **Sundial Goods:**
  - a Fall sale on Sep 26–28 that lifted orders but pulled demand forward, and last year's sale and Black Friday to compare;
  - TikTok spend ramping while its ROAS sits below break-even, and Meta claiming more orders than the store recorded;
  - a tracking change that moves sessions without moving sales;
  - the best-selling Trail Runner 2 running out 3 days before its purchase order lands, and a beanie already out;
  - mobile shoppers abandoning at the payment step more than last period;
  - a high-return suede boot, mostly sent back for size; footwear exchanges, mostly one size up, show the line runs small.
- **Relay:**
  - an onboarding checklist that lifted activation and shipped, scored from its counts;
  - a pricing test whose traffic split 52/48 against a planned 50/50, and a digest email past its unsubscribe limit;
  - iOS duplicate events that inflate "any event" actives, and an Oct 8 restatement;
  - Android retention lagging web, and a Labor Day dip an alert would have caught;
  - Automations as a feature that goes with staying but few users find;
  - Harbor & Pine slipping, Kestrel Labs ready to expand, and Business seat cuts in September's MRR.
  - free to paid at 4.4%, inside the freemium "good" band; Automations converting best of the Free limits but few reaching it;
  - Brightline Health under-pacing its AI credit commit 41 days before renewal, Orbit Fintech over;
  - in the weekly review, signups 4.6% behind plan with no known cause (owner: Growth).

Every tool derives from one history, so numbers agree across cards. In e-commerce it is one daily history per channel: the sales breakdown's total equals the KPI strip's total sales, and channel revenue and new customers add up to the store totals. The customer base is sized from that order history too: a year's active customers include all its new customers, the RFM segments scale with them, and the repeat purchase rate, the order journey, and 12-month LTV come from the same reorder, order-gap, and cohort models the other cards use. In analytics it is a simulated user population per platform and plan, so daily, weekly, and monthly actives, lifecycle states, and retention cohorts are counted from the same users; revenue is anchored to the paying workspaces. Users away 120 days or more have churned and rarely return, and the simulation starts from four years of history, so actives grow with signups and with the cohorts whose retention has flattened, not with every user ever. The 8,000 paying workspaces, mostly small teams, fit the flows into them: about 300 new paying workspaces a month from the monetisation funnel, at roughly 1.5% churn; signups by source add up exactly to the activation funnel's signups.

## Visual design

The galleries follow what well-regarded product dashboards do, checked against [Stripe's dashboard and chart patterns][stripe-charts], [a breakdown of Stripe's dashboard][stripe-breakdown], [Tremor and shadcn KPI cards with sparklines][shadcn-stats], and [2026 SaaS dashboard examples][adminlte-2026]:

- **One hero per dashboard.** `HeroMetric` shows the number the dashboard is about at 52px, its change, and a large trend of this period against the prior one, with promotions and holidays shaded. Everything else is smaller.
- **A fixed reading order.** Each dashboard opens with a hero row (the hero, and a card that explains it: insights, a funnel, or a profit breakdown), then one KPI strip, then detail rows. The prompt rules describe the same order, so generated dashboards look like the gallery.
- **Balanced rows.** Cards in a row stretch to the same height. Trend and column charts grow into height a taller neighbour leaves, up to 420px, and cards are paired so their contents are close in height (the [bento grid][bento] idea). Number-titled card headers read as a metric: the label on top, the figure below.
- **Labels never collide.** Event labels sit above the lines with a halo in the card's colour, take the first row where they fit, and are left to the tooltip when none has room; quadrant labels go to the biggest bubbles first and are left off rather than drawn over another.
- **KPI strips fill their card.** The strip measures its width and balances its rows, so six KPIs wrap as 3 + 3 instead of 5 + 1, and a shorter last row stretches to the full width. Tiles in a row share row lines, so values align when a label wraps. A KPI with real values has a sparkline, coloured by whether its change is good for that metric; one without (a fixed model property such as the gap between orders) shows its number alone.
- **Every chart is the kit's own, on d3, picked by the card's job.** Counts per period and composition use `ColumnChart` (grouped, or stacked from zero with losses below: lifecycle, customer base growth, MRR movements, category sales); part-to-whole uses `ShareBar`; weekday × hour uses `HeatGrid`; anything over time uses `TrendChart` (a line far from zero, such as NRR near 110%, fits its range; areas keep zero); ranked categories use `BarList`. Each chart serves both kits where the job recurs: `HeatGrid` shows when orders come in and when people work; `SegmentFlow` shows customers moving between RFM segments and users between lifecycle states; `BurnDown` paces AI credit commits and ad budgets; `Tracker` shows fulfillment days and alert back-test days. `SixTwelve` stays in analytics: the store's 18 months of history cannot set 12 months against last year. They replaced react-ui's `BarChart`, `HeatmapChart`, and `SegmentedBar`, so every chart shares one interaction model (hover follower and tooltip, other marks stepping back, legend focus and pin, arrow keys) and colours come from the kit tokens directly (finding 10 no longer applies). All of them are built the way react-ui builds its charts:
  - a hook-free dispatcher that renders the empty state, and an implementation split into `parts/`;
  - d3 throughout, as react-ui uses it: `scalePoint`, `scaleBand`, `scaleLinear`, and `scaleSqrt` place the marks, d3-shape draws them (`line` and `area` on the monotone curve react-ui calls "natural", `arc` for the gauge), and d3-selection's `pointer` resolves hovers;
  - geometry in pure modules with unit tests (`seriesGeometry`, `trendGeometry`, `columnGeometry`, `goalGeometry`, `heatGeometry`, `quadrantGeometry`, `flowGeometry`, `burnGeometry`, `waterfallGeometry`, `sixTwelveGeometry`, `trackerUtils`);
  - react-ui's motion, ported: one spring data morph per chart over a flat pixel vector, so a filter or a KPI tab glides every curve, band, guide, and bubble together; hover followers that stay mounted (`FadeFollower`), so the crosshair glides between points and fades in and out, with dots that ride the curve; a tooltip on react-ui's tooltip spring; and react-ui's entrances (lines draw on, washes fade in, bars and blocks grow in);
  - one stylesheet per chart, with classes under the `kit` prefix (`kit-trend-chart-*`), on shared chart mixins.

  Two rules keep the motion smooth. Charts measure their container before the first paint, so nothing draws at a guessed width and stretches into place. And only data changes glide: a resize (or the first measurement) snaps.

  Where a react-ui chart was close but not a fit, the kit keeps its own:

  | Kit chart          | Closest react-ui chart       | Why the kit keeps its own                                                                                                                                       |
  | ------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `Sparkline`        | `MiniAreaChart`              | `MiniAreaChart` keeps one point per 20px, so an 84px cell shows 5 of 30 days, and its range starts at zero, which flattens a KPI that moves between 40K and 45K |
  | `ConversionFunnel` | `FunnelChart`                | The kit funnel shows what continues and drops off between steps, the median time between them, and the change against the prior period                          |
  | `QuadrantChart`    | `ScatterChart`               | The quadrants need split lines, quadrant names, bubble sizes, and labels that never overlap                                                                     |
  | `GoalPace` gauge   | `RadialChart` (semicircular) | The gauge marks where the pace says the month should be                                                                                                         |
  | `TrendChart`       | `LineChart`, `AreaChart`     | The trend needs the prior period, the shaded gap, events, goal lines, benchmark bands, and the in-progress last point                                           |

  The whole chart family follows one set of rules:
  - form first, then colour by the job the colour does;
  - categorical colours in a fixed order, validated for colour-vision deficiency in both modes;
  - an emphasis pattern: the series the story is about in the accent, context such as the prior period in muted grey;
  - 2px lines, columns at most 24px wide with rounded data ends, 2px gaps between stacked segments, hairline grid;
  - a crosshair tooltip on every trend and a tooltip on every column, readable with the arrow keys;
  - one axis per chart, and a legend whenever there are two or more series;
  - green, amber, and red only for status, always with an icon or label.

- **The dashboard responds.** A second research round ([Plausible][plausible], [shadcn charts][shadcn-charts], [Observable Plot][plot-difference], [Polaris Viz][polaris-viz], [Cloudscape][cloudscape-states], [Carbon][carbon-legends], [Shopify Analytics][shopify-2026], [NumberFlow][numberflow]) added:
  - **KPI tiles are tabs for the hero.** HeroMetric and KpiStrip share a `$metric` binding (a `reactive()` prop read with `useStateField`); selecting a tile shows that metric, with its own trend against the prior period, in the hero chart. Every KPI tool returns a trend per KPI.
  - **The prior period is dotted, and the gap is shaded:** in the good tone where this period is ahead in the metric's good direction, the bad tone where it is behind. The tooltip adds the change against the prior period.
  - **Loading skeletons shaped like each component**, shown while the dashboard streams or a Query runs, then an empty message only once both have settled.
  - **Values roll into place** when they first show and when a filter changes them.
  - **Legends are interactive:** hovering a series brings it forward and fades the rest; a click pins it. Line charts label every series at its end, nudged apart so labels never overlap.
  - **Events explain themselves:** hovering inside a shaded event adds its detail to the tooltip ("Fall sale · 20% off sitewide"). The hero shows when the data was last updated, with a live dot.
  - **Today is marked as in progress.** The last point of every trend that ends today is dotted with a hollow dot, and its tooltip says the value is projected from the pace so far ([Plausible][plausible]).
  - **Goals and benchmarks sit on the chart.** A trend can carry a dashed goal line (Blended ROAS against its 1.7x break-even, LTV:CAC against 3x) or a shaded benchmark range (MER 3–5x, conversion 1.5–3.5%), both named in the legend so their labels never collide with the data ([Grafana thresholds][grafana-thresholds]).
  - **GoalPace** shows progress toward the month's goal: a gauge of the share reached with a tick where the pace says it should be, whether the month is on pace and where it is projected to finish, what is needed per day, and the running total against the straight-line pace ([Shopify Targets][shopify-2026], [Mantine gauge][mantine-gauge]).
  - **Tracker** shows a strip of days against a target, each colored by whether it met it, with the day's figure on hover; the Merchandising dashboard uses it for orders shipped within 48 hours ([Tremor Tracker][tremor-tracker]).
  - **Breakdowns filter the dashboard.** Items carry the filter value they stand for (`key`); given the filter's `$binding`, selecting a channel in the share bar or a row in a bar list sets that filter, fades the other parts, and offers "Show all" to clear it ([PostHog][posthog-filters]).
- **A designed dark mode.** The package's `src/theme/_theme.scss` defines every colour as a token on `.kit-theme`, with its own dark steps (not an inversion) for the page, cards, ink, the categorical slots, the ordinal funnel ramp, and status colours. The app's Light, Dark, and System switch sets the mode on the kit theme and on the base `ThemeProvider`.
- **Type:** Geist for text and Geist Mono for event names and code, with tabular numbers wherever figures line up.

| Token set   | Light                                                             | Dark                                                              |
| ----------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| Surfaces    | page `#f3f5f8`, card `#ffffff`                                    | page `#08090d`, card `#10131a`                                    |
| Categorical | `#2a78d6 #eb6834 #1baf7a #eda100 #e87ba4 #008300 #4a3aa7 #e34948` | `#3987e5 #d95926 #199e70 #c98500 #d55181 #008300 #9085e9 #e66767` |
| Funnel ramp | `#104281 → #86b6ef`, darkest first                                | `#9ec5f4 → #184f95`, lightest first                               |

## Layout

```
packages/dashboard-kits/src/
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

examples/miscellaneous/dashboard-kits/src/kits/
  libraries.ts              dashboardLibrary + each kit
  client.ts server.ts       Renderer libraries and tool provider; specs, prompts, sample-data tools
examples/miscellaneous/dashboard-kits/scripts/check-kits.ts   contract check for every kit
```

The package has four entry points. `@openuidev/dashboard-kits` has the shared blocks, both as openui-lang definitions and as plain React views; `/ecommerce` and `/analytics` have each kit's library factory and components; `/server` has the kit definitions, tool contracts, sample-data handlers, and prompt assembly, and imports no React. `/styles.css` is the compiled theme and component styles.

The server never imports a library. `npm run generate` writes each library's spec to `src/generated/`, and the server builds prompts from that JSON.

## How a kit extends the base library

The base is `dashboardLibrary` from `@openuidev/thesys` 0.14.0, the same component set as Muse's dashboard plane. It is passed in, so the package does not depend on one base: `createEcommerceLibrary(base)` and `createAnalyticsLibrary(base)` call `createKitLibrary(base, definition)`.

**Containers must be widened.** `MediumCard` and `LargeCard` declare their children as a closed list. Adding a component to the library leaves it out of that list, so the prompt still says the cards cannot hold it. Each kit component therefore declares the cards it fits in:

```ts
components: [
  { component: ConversionFunnel, slots: ["MediumCard", "LargeCard"] },
  { component: LifecycleChart, slots: ["LargeCard"] }, // too wide for MediumCard
];
```

`createKitLibrary` rebuilds those cards with their child list extended and keeps their renderers. `CardRow` is unchanged, because kit components are card content, not cards.

The client parser does not check placement. It only checks that a component exists: `PieChart` inside `LargeCard` parses without an error even though the schema forbids it. Placement comes from two places, which is why widening matters:

- the prompt signature, which tells the model where a component can go;
- the JSON Schema, which server-side validators such as Muse's check.

**Tool outputs and component props share one schema.** The package's `core/schemas.ts` and each kit's `tools.ts` define the shapes once. The tool's output schema and the component's props both use them, so a `Query` result plugs in without reshaping, and the two cannot drift apart. For example:

- `KpiStrip(kpis.metrics)`
- `ChannelPerformance(mkt.channels, mkt.targetRoas)`
- `LifecycleChart(life.labels, life.newUsers, life.returning, life.resurrecting, life.dormant, life.quickRatio)`

**KPIs carry their direction.** Each KPI says whether up is good, bad, or neutral. `KpiStrip` therefore shows a falling CPA or a falling time-between-orders in green and a rise in MRR at risk in red. The base `SmallCard` trend always treats up as good.

**The kit restores the base's prompt guidance.** The published 0.14.0 library has no component groups, so its prompt lists signatures but none of the layout rules from the genui-sdk source. `base-prompt.ts` carries those groups and rules until the base library ships with them.

## Prompt

Each kit's prompt is assembled from:

- the library spec;
- the tools with input and output JSON Schema;
- the base layout rules;
- the shared data rules;
- the kit's own rules: filters, metric definitions, which tool answers which question, and how to title cards;
- the kit's example dashboards (two or three per kit; the rest of the gallery is for people, not the prompt).

The e-commerce prompt is 63,981 characters, and the analytics prompt 63,976, against a budget of 64,000 for each that `npm run check` enforces (the plans aimed for 60,000; the first two kits, fully built, settled just under 64,000). Tool outputs that only flow into a component are collapsed to `object` in the prompt (`.meta({ opaque })`), filter inputs read as `string`, component props that take a tool's items are loose records, and metrics define themselves once: the glossary lists the ones the model must reason about, and every KPI carries its own definition.

## Data contract

- Tools are read-only. Dashboards call them with `Query()`, and filters re-run them through `$bindings`.
- Each tool is defined once with zod. The prompt gets MCP-style `inputSchema` and `outputSchema`, and the tools route validates arguments and results against the same schemas (`runTool`).
- KPI tools return a `periodLabel` ("Sep 11 – Oct 10, 2026 vs prior 30 days") for the dashboard header and a `metrics` list for `KpiStrip`.
- A KPI shows a sparkline only when its tool has real values for it, and a trend (the chart a selected tile shows) only when there is a value for every day of the period. Nothing is drawn from invented data: a metric with no history, such as the median gap between orders, shows its number alone.
- Insight tools return detected changes, each with a tone, a headline, an explanation, and a key figure.
- `npm run check` does five things:
  - parses every gallery dashboard against its kit's library;
  - rejects Queries to unknown tools;
  - calls every tool with every value of every enum argument (593 calls) and validates each result;
  - builds every prompt;
  - fails a prompt over its size budget.

## Serving

### Now: self-hosted prompt (works today)

1. The server builds the system prompt with `generateSystemPrompt({ ...spec, tools, preamble, additionalRules, toolExamples })`.
2. `/api/generate` sends it, with the user's request, to OpenUI Gateway or any OpenAI-compatible endpoint, then streams the openui-lang back.
3. The browser renders with the same kit library. Each `Query` goes through the Renderer's `toolProvider` to `/api/tools/<kit>/<tool>`.

### Target: OpenUI Cloud managed config

`generateSystemPrompt({ cloud: true, library: spec, promptOptions })` sends the kit's library, preamble, rules, and examples to Muse, and Muse builds the prompt (path 4, `chatLibrary`). Muse's limit is 400,000 characters, so a kit fits.

Two gaps block this today:

1. **Tools are not on the Cloud wire.** `CloudPromptOptions` carries only `examples`, `preamble`, and `additionalRules`, so the model is never told which tools `Query()` can call. There are three options:
   - add `tools` to the Cloud config and Muse's path 4;
   - reuse muse#612's script tool definitions;
   - pass the tool list as `instructions` text.
2. **Muse's dashboard plane uses a fixed library.** `thesys_generate_dashboard` loads a prompt and schema compiled into Muse, so a kit cannot reach it without a Muse change.

## Where kits live

- **Now:** the `@openuidev/dashboard-kits` package in `packages/dashboard-kits`, with both kits, beside react-ui rather than inside it. It depends on react-ui for the theme (the chart palettes it reads through `useTheme`) and on react-lang and lang-core for definitions and prompts, and takes the base dashboard library as an argument. It builds, tests, lints, and passes publint and attw like the other packages, and carries a changeset; it has not been published.
- **The app** stays an example. It installs the package from a local `pnpm pack` tarball, because npm cannot resolve the workspace's `catalog:` versions. The tarball has a fixed name, `.kits/dashboard-kits.tgz`, so a version bump does not break the dependency. The app is not listed in `examples.json`: `openui create -e dashboard-kits` would scaffold an app whose dependency is a gitignored local tarball, and the install would fail. Once the package is published, the tarball becomes a version and the app can be listed.

## Base library findings

These are not kit bugs. Each one affects anyone who builds on the dashboard artifact.

1. The published `dashboardLibrary` (0.14.0) has no component groups, so its prompt has none of the source's layout rules.
2. The client parser accepts components in containers whose schema forbids them.
3. `Col(label, data, "number")` renders raw, left-aligned numbers (8734327), although the base rules say number columns are right-aligned.
4. `FilterBar` never wraps (`flex-wrap: nowrap`), so a bar with three filters makes the page 572px wide on a 375px phone. The kit theme (`src/theme/_theme.scss` in the package) adds a wrap override.
5. On first render, every `Query` that reads a `$binding` fires twice with identical arguments, in development and in production; a `Query` with no bindings fires once. The Store overview makes 14 calls for 7 queries. This matches the react-lang `useOpenUIState` double fetch found in the dashboard QA.
6. Next.js production builds break with `@openuidev/thesys` 0.14.0. SWC re-minifies the already minified bundle and emits a duplicate `let` (`Identifier 'i' has already been declared`). The server chunk then fails to prerender and the matching browser chunk fails to parse, with both Turbopack and webpack. This app sets `experimental.turbopackMinify: false`.
7. A collapsed card, `MediumCard(children, true)`, renders as an empty 38px strip when its row wraps (seen at about 950px wide): the content is clipped and no Expand control shows. The gallery does not collapse cards.
8. The base `SmallCard` and `MetricIndicator` trends always treat up as good, so a falling CPA shows red. `KpiStrip` takes a good direction per metric.
9. `@openuidev/thesys` 0.14.0 requires `react-ui` and `react-headless` ^0.14. This app uses 0.17.1 (the kit package needs react-ui 0.17) through npm `overrides`; all eight dashboards render with no errors, but a `thesys` release on 0.17 would remove the override.
10. The base charts cannot be themed from outside. `DashboardThemeProvider` nests its own `ThemeProvider` inside every dashboard, and the charts read their palettes from that JavaScript context, so neither CSS variables nor an outer `ThemeProvider` reach them. The kits draw their own d3 charts, which take series colours from the active theme's chart palette (`useKitPalette`), and the kit prompts steer the model away from the base `LineChart`, `AreaChart`, `BarChart`, and `PieChart`.
11. react-ui charts take no value formatter: ticks are abbreviated numbers with no unit, so a sales axis reads 12K rather than $12K and a rate cannot show %. The kits name the unit in the axis label ("Sales (USD)") and keep currency and percentage trends on their own `TrendChart`.
12. react-ui reorders a categorical `customPalette`: `getDistributedColors` takes colours outward from the middle of the palette, so series do not get the colours in the order given. The kit charts no longer go through react-ui's charts: `useKitPalette` takes colours from the theme's ramp the same way (`distributeColors`, centred on the ramp's middle step), so a theme recolours kit and react-ui charts alike.
13. react-ui's chart motion is internal: the spring and data morph, `FadeFollower`, `useSeededAim`, `useTranslate`, `AnimatedPath`, the line crosshair, and the d3 series geometry are not exported, so the kit ports them (`Charts/shared`, with tests and a note naming each source). Exporting them would let other packages build charts that move like react-ui's without a copy.
14. A react-ui chart's entrance runs only once, on mount: on a filter change `BarChart` bars snap to their new heights. (An earlier draft of this document reported a bar stuck at zero height after its entrance; that was a capture taken mid-animation. All 240 animated bars on the Merchandising dashboard finish at full height.)

15. A streamed `$variable` default can lock in half-received. Mid-stream the parser reports `$range = "3` as `"3"` (and `$range = "` as `""`), and react-lang's store applies a declared default only to a key it has not seen, so the finished `"30d"` never replaces it. The filter then shows no selection and every Query reading it fails validation. It depends on where the network chunks split, so it is intermittent; replaying a failing program one character at a time reproduces it every time. The Generate view holds back an unfinished `$` declaration line until its newline arrives, and the prompt asks for declarations before first use. A fix belongs in react-lang: initialize state from completed statements only, or let a declaration update a default the user has not changed.

## Open questions

1. One "e-commerce analytics" kit, or separate e-commerce and analytics kits? This draft builds two, sharing four analytics blocks.
2. Should the base be `@openuidev/thesys` (published, source not public) or a revived react-ui dashboard library (#1292)?
3. Should the shared blocks (`KpiStrip`, `InsightList`, `ConversionFunnel`, `CohortGrid`) move into the base dashboard library itself?
4. How should tools reach the model under Cloud managed config?
5. Is `@openuidev/dashboard-kits` the right home, or should kits be one package each? Who owns kit component design?
6. Should kits ship connectors to real data, such as Shopify, GA4, or PostHog, or only the tool contract?
7. Should the kit chart family and its theme tokens replace the base charts, so every dashboard gets them?

Not in this draft: mutations (`ActionCards` approve and dismiss only write to the card's own log), editing a generated dashboard, persistence, and authentication.

## Adding a kit

1. Copy `packages/dashboard-kits/src/analytics` to `src/<id>` and add a `src/<id>.ts` entry point (and its line in `tsdown.config.ts` and the `exports` map).
2. Write the tools in `tools.ts`, reusing `core/schemas.ts` shapes where they fit, then their handlers in `data/` (`data/handlers.ts` maps tool names to them).
3. Write the components with props that reuse the tool schemas, and list their slots, plus any shared blocks, in `library.ts`. Reuse a react-ui chart where one fits; build a new one under `components/Charts` in the same shape as `TrendChart`.
4. Write the preamble, definitions, rules, gallery dashboards, and starters in `kit.ts`, then add the kit to `KITS` and `SAMPLE_HANDLERS` in `src/server.ts`.
5. In this app, create the library in `src/kits/libraries.ts`, register it in `client.ts` and `server.ts`, add it to the `generate` script, run `npm run kits:pack`, and run `npm run check`.

[shopify-overview]: https://www.polaranalytics.com/post/shopify-analytics-guide
[shopify-finance]: https://help.shopify.com/manual/shopify-mobile-app/reports-on-mobile/
[lifetimely]: https://help.useamp.com/article/1368-sales-breakdown-report
[triple-whale]: https://kb.triplewhale.com/en/articles/6127778-summary-page-metrics-library
[ga4-journeys]: https://www.practicalecommerce.com/new-ga4-shopper-journey-reports-are-powerful
[shopify-cohorts]: https://changelog.shopify.com/posts/enhancements-to-the-cohort-analysis-report
[shopify-rfm]: https://www.shopify.com/blog/rfm-analysis
[posthog-lifecycle]: https://posthog.com/docs/product-analytics/lifecycle
[amplitude-growth]: https://amplitude.com/blog/growth-accounting
[posthog-stickiness]: https://posthog.com/docs/product-analytics/stickiness
[mixpanel-power]: https://mixpanel.com/blog/power-users/
[amplitude-matrix]: https://amplitude.com/docs/en/analytics/charts/engagement-matrix/engagement-matrix-interpret
[amplitude-experiment]: https://amplitude.com/docs/feature-experiment/analysis-view
[stripe-charts]: https://docs.stripe.com/stripe-apps/patterns/chart-layout
[stripe-breakdown]: https://www.925studios.co/blog/stripe-dashboard-design-breakdown
[shadcn-stats]: https://www.shadcn.io/blocks/stats-sparkline
[adminlte-2026]: https://adminlte.io/blog/25-best-dashboard-design-examples-for-2026-real-products-principles/
[bento]: https://www.rocket.new/blog/bento-grid-ui-dashboard-no-code-for-saas
[plausible]: https://plausible.io/docs/guided-tour
[shadcn-charts]: https://ui.shadcn.com/charts
[plot-difference]: https://observablehq.com/plot/marks/difference
[polaris-viz]: https://github.com/Shopify/polaris-viz
[cloudscape-states]: https://cloudscape.design/components/cartesian-chart/?tabId=usage
[carbon-legends]: https://carbondesignsystem.com/data-visualization/legends
[shopify-2026]: https://www.shopify.com/blog/analytics-spring-2026
[numberflow]: https://number-flow.barvian.me
[grafana-thresholds]: https://grafana.com/docs/grafana/latest/panels/thresholds/
[mantine-gauge]: https://mantine.dev/charts/gauge-chart/
[tremor-tracker]: https://tremor.so/docs/visualizations/tracker
[posthog-filters]: https://posthog.com/docs/web-analytics/dashboard
