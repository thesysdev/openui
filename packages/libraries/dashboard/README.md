# @openuidev/dashboard-library

An OpenUI component library for dashboards: the components, prompt options and examples a model
uses to compose dashboards.

## Install

```sh
pnpm add @openuidev/dashboard-library
```

## Usage

Generate the system prompt with the CLI from a file that re-exports the library:

```ts
// src/lib/dashboard-library.ts
export { library, promptOptions } from "@openuidev/dashboard-library";
```

```sh
npx @openuidev/cli generate src/lib/dashboard-library.ts --out src/generated/system-prompt.txt
```

Send that file as the system message, then render the model's response:

```tsx
import { ThemeProvider, library } from "@openuidev/dashboard-library";
import { Renderer } from "@openuidev/react-lang";

export function DashboardMessage({ response }: { response: string }) {
  return (
    <ThemeProvider mode="dark">
      <Renderer response={response} library={library} />
    </ThemeProvider>
  );
}
```

`ThemeProvider` is optional. It sets the mode (light by default) and takes `lightTheme`
and `darkTheme` overrides.

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
