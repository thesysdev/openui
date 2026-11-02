# @openuidev/dashboard-kit (beta)

The OpenUI dashboard AI component library: the registry, prompt options and
examples that tell a model which components it may emit for dashboard surfaces.

Rendering comes from `@openuidev/react-components`, which is a required peer.

## Install

```sh
pnpm add @openuidev/dashboard-kit@0.0.0-beta.0 @openuidev/react-components@0.0.0-beta.0
```

`@openuidev/react-components`, `@openuidev/react-lang`, `react`, `react-dom` and
`zod` are peer dependencies.

## Usage

```ts
import {
  openuiDashboardLibrary,
  openuiDashboardPromptOptions,
} from "@openuidev/dashboard-kit/lib";

const systemPrompt = openuiDashboardLibrary.prompt(openuiDashboardPromptOptions);
```

Then render a model's response with `Renderer` from `@openuidev/react-lang`:

```tsx
<Renderer response={program} library={openuiDashboardLibrary} />
```

- `/lib` exports the five AI-integration values plus `dashboardComponents`.
- The root entrypoint exports the standalone React components, such as `Dashboard`,
  `Section`, `CardRow` and `DashboardThemeProvider`.
- Components style themselves with goober, so there is no stylesheet to import.

## Styling

Styles follow the same flat contract as `@openuidev/react-components`:

- Every element has one generated class and one stable class. Each `<name>.styles.ts`
  exports them as `names` and `styles`, and all stable classes start with
  `openui-dashboard-`, so a plain class in your stylesheet can target and override them.
- Variants set private `--_openui-dashboard-*` variables that the parts read. States are
  attributes such as `data-collapsed`, `data-empty` and `aria-expanded`.
- Every `--openui-*` token has a fallback, so components still render without a provider.
- The kit only keeps what react-components doesn't already style. Where it has to change a
  react-components element, it uses a wrapper class plus that element's stable class, such
  as `& .openui-date-picker-trigger`.

## The library

Root component is `Dashboard`. 47 components in 6 groups:

| Group | Components |
|---|---|
| Dashboard Layout | `Dashboard`, `DashboardHeader`, `Section`, `FilterBar`, `FilterSelect`, `FilterMultiSelect`, `DatePicker`, `CardRow`, `IconButton` |
| Shell Cards | `SmallCard`, `MediumCard`, `LargeCard`, `DashboardCardHeader`, `List`, `ListItem`, `EntityList`, `Callout`, `Button`, `ButtonGroup`, `Select`, `SelectItem`, `ImageBlock`, `Tag`, `TagBlock`, `TextContent`, `MarkDownRenderer`, `TextCallout` |
| Metrics | `MetricIndicator`, `OverviewCardItem`, `OverviewCardBlock` |
| Charts | `LineChart`, `BarChart`, `AreaChart`, `HorizontalBarChart`, `RadarChart`, `ScatterChart`, `RadialChart`, `PieChart`, `Series`, `ScatterSeries`, `Point` |
| Data Display | `Table`, `Col` |
| Primitives | `Icon`, `IconTag`, `IconText`, `TextBlock` |

`Series`, `ScatterSeries` and `Point` are the chart data nodes. `IconTag`,
`IconText`, `TextBlock` and `OverviewCardBlock` have no typed parent: they reach a
dashboard through `SmallCard`'s slots, as its description says.

## What makes it a dashboard library

The component list matters less than the **layout grammar** the groups carry as
`notes`, which the generated system prompt inherits:

- `Dashboard` is the root, with `DashboardHeader` plus `Section` children.
- A `Section` owns rows and an optional section-scoped `FilterBar`.
- `CardRow` arranges cards. Valid patterns are small-only, medium-only,
  medium+large mixed, or large-only.
- `FilterBar` accepts only `FilterSelect`, `FilterMultiSelect` and `DatePicker`.
- `SmallCard` has three forms — overview card with icon, overview card, and
  snippet card — each with a stated rule for when to choose it.
- Some combinations are explicitly refused: no `PieChart`, `RadialChart` or
  `RadarChart` inside `LargeCard`; no `FilterBar` inside `MediumCard` or
  `LargeCard`.

That grammar is why this component library is smaller than a general component set — 47
components and a ~18,000-character system prompt — while producing dashboards
rather than a vertical stack of cards.

## Provenance

The library is ported from genui-sdk's `packages/c1/src/dashboard`, with its
rendering retargeted from `@openuidev/react-ui` and `@openuidev/visualization`
onto `@openuidev/react-components`. Two deliberate changes:

- `Table` and `Col` are real component definitions rather than a string lookup
  into the legacy `openuiLibrary` registry, so they are no longer typed
  `DefinedComponent | undefined` and the kit does not depend on the old library.
- The Sass is gone: styles are rewritten flat in goober, and the `c1-` class prefix
  is now `openui-dashboard-`.
