# @openuidev/dashboard-kit

An OpenUI component library for dashboards: the component registry, prompt options and examples
that let a model compose `Dashboard`, `Section`, `CardRow`, filters, cards and charts. Rendering
comes from `@openuidev/react-components`.

## Install

```sh
pnpm add @openuidev/dashboard-kit react react-dom zod zustand
```

`@openuidev/react-components` and `@openuidev/react-lang` come with it. Peer dependencies: React
18 or 19 and `zod` 3.25 or 4, plus `react-dom` and `zustand` for `@openuidev/react-components`.

## Usage

Generate the system prompt ahead of time with the CLI from a file that re-exports the library:

```ts
// src/lib/dashboard-library.ts
export {
  openuiDashboardLibrary as library,
  openuiDashboardPromptOptions as promptOptions,
} from "@openuidev/dashboard-kit";
```

```sh
npx @openuidev/cli generate src/lib/dashboard-library.ts --out src/generated/system-prompt.txt
```

Send that file as the system message, then render the model's response:

```tsx
import { openuiDashboardLibrary } from "@openuidev/dashboard-kit";
import { ThemeProvider } from "@openuidev/react-components";
import { Renderer } from "@openuidev/react-lang";

export function DashboardMessage({ response }: { response: string }) {
  return (
    <ThemeProvider>
      <Renderer response={response} library={openuiDashboardLibrary} />
    </ThemeProvider>
  );
}
```

The package exports the AI integration only: `openuiDashboardLibrary`, its component groups,
examples, rules, prompt options and `dashboardComponents`, for spreading into a larger library.
The dashboard takes light or dark mode from the surrounding `ThemeProvider`.

## Styling

Components style themselves with `css` from `@openuidev/react-components`, so there is no
stylesheet to import. Their rules go into the same `<style id="openui-styles">` tag, after the
component rules, and follow `configureStyles({ layer })` if you set one.

Every element carries a stable `openui-dashboard-*` class:

```css
.openui-dashboard-section-title {
  color: #7c3aed;
}
```

## Components

`Dashboard` is the root. 46 components in 6 groups:

| Group            | Components                                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard Layout | `Dashboard`, `DashboardHeader`, `Section`, `FilterBar`, `FilterSelect`, `FilterMultiSelect`, `DatePicker`, `CardRow`, `IconButton`                                                                                              |
| Shell Cards      | `SmallCard`, `MediumCard`, `LargeCard`, `DashboardCardHeader`, `List`, `ListItem`, `EntityList`, `Callout`, `Button`, `ButtonGroup`, `Select`, `SelectItem`, `ImageBlock`, `Tag`, `TagBlock`, `TextContent`, `MarkDownRenderer` |
| Metrics          | `MetricIndicator`, `OverviewCardItem`, `OverviewCardBlock`                                                                                                                                                                      |
| Charts           | `LineChart`, `BarChart`, `AreaChart`, `HorizontalBarChart`, `RadarChart`, `ScatterChart`, `RadialChart`, `PieChart`, `Series`, `ScatterSeries`, `Point`                                                                         |
| Data Display     | `Table`, `Col`                                                                                                                                                                                                                  |
| Primitives       | `Icon`, `IconTag`, `IconText`, `TextBlock`                                                                                                                                                                                      |

## Development

```sh
pnpm --filter @openuidev/dashboard-kit run build
pnpm --filter @openuidev/dashboard-kit run ci
```

The build writes ESM and CJS bundles with declarations and source maps to `dist/`.
