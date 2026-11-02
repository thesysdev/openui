# @openuidev/intelligent-kit (beta)

The Open Intelligent UI component library, packaged: primitives a model
arranges itself, plus the widgets a model cannot draw (a street map, a sandboxed
HTML page) and 59 generic `@functions` so an answer can compute with its own
state.

Extracted from [thesysdev/open-intelligent-ui](https://github.com/thesysdev/open-intelligent-ui),
which recreates ChatGPT's Intelligent UI on OpenUI.

## Install

```sh
pnpm add @openuidev/intelligent-kit@0.0.0-beta.0
```

`@openuidev/react-components`, `@openuidev/react-lang`, `@openuidev/lang-core`,
`react`, `react-dom` and `zod` are peer dependencies. It needs react-components 0.0.1, the
published release, which itself expects `zustand` 4 (`^4.5.5`). Like the chat and
dashboard kits, it draws with react-components where that has the component
(Button, Input, Select, Table, the charts, ...); the rest are the kit's own.

## Usage

```ts
import { library, promptOptions } from "@openuidev/intelligent-kit/lib";
```

The components bring their own styles, so there is nothing else to import. Rendering
needs a bundler, because `Map` and `Math` load the sheets of maplibre-gl and KaTeX on
first use. Importing doesn't, so a server or a script can read `library.toSpec()` in
plain Node.

```tsx
<Renderer response={program} library={library} />
```

- `/lib` exports `library`, `baseComponents`, `baseComponentGroups`,
  `promptOptions`, `dashboardPromptOptions`, `functions`, `actions`,
  `runLibraryAction`, the four worked examples, `demoToolSpecs` (the Query
  tool specs `dashboardPromptOptions` advertises to a model), and every
  component definition, so a host can compose its own library from a subset or
  extend this one.
- The root entrypoint exports the kit's own React components (`Card`, `Col`,
  `Popover`, `MapView`, ...), usable without openui-lang, and the kit
  configuration.

## Layout

Laid out like the dashboard kit:

```
src/
  index.ts                          "use client", the host configuration and the
                                    kit's own components
  env.d.ts                          module declarations (the maplibre and KaTeX sheets)
  components/<Name>/                the kit's own React components, no openui-lang:
    <Name>.tsx  <name>.styles.ts  index.ts
    Map/parts/  Map/hooks/          the map's pieces and hooks, beside MapView.tsx
  shared/                           what both halves need:
    tokens.ts                       the tokens, read from ThemeProvider
    props.ts                        the model's prop values as CSS
    color.ts  url.ts  text.ts       raw-colour backgrounds, safe links, text helpers
    flow.styles.ts                  the spacing system
    useThemeMode.ts  config.ts      ThemeProvider's mode; the host configuration
  lib/
    index.ts                        the library and every component definition
    <Name>/{index.tsx, schema.ts}   one binding per library component
    Svg/                            the drawing family, one file per shape
    Map/places.ts                   the model's places, as the map draws them
    Action/                         the library's action and runLibraryAction
    functions/                      the @functions, by subject, and their helpers.ts
    prompt-options/  demo/          prompt examples and rules; the demo tools
    defineComponents.ts             the definitions
    openuiIntelligentLibrary.ts     the library and its groups
    schemas.ts  controls.ts         shared prop schemas; the form controls' hooks
  __tests__/                        fast, browser, function and source-comparison tests
```

A binding maps the model's props onto components and draws no markup of its
own. Eight bind straight to react-components (`Chart`, `DatePicker`,
`Divider`, `Input`, `Label`, `Select`, `Table`, `TextArea`); the rest render a
component from `src/components`, which holds whatever the kit draws itself: its
layout, text and media, the map, and the controls with their own look (`Badge`,
`Button`, `IconButton`, `SegmentedControl`, `Slider`, `Timer`, `Checkbox`,
`RadioGroup`, `Field`).

## Styling

Styles follow the same flat contract as `@openuidev/react-components` 0.0.1 and use its public
`css` and `keyframes`:

- Every element has one generated class and one stable class. Each `<name>.styles.ts`
  writes its rules with react-components' `css`, so they go in its `<style id="openui-styles">`
  tag and follow `configureStyles({ layer })`, and exports them as `<name>Styles` (`buttonStyles`, like react-components) and `names`, and all stable classes start with
  `openui-intelligent-`, so your stylesheet can target them. With the kit in your layer
  (`configureStyles({ layer })`), a single class overrides it; without one, a rule needs two
  classes and has to load after the kit's.
- Variants set private `--_openui-intelligent-*` variables that the parts read. States are
  attributes such as `aria-pressed`, `aria-checked`, `data-state` and `data-selected`.
- Every token has a fallback, so components still render without a provider.
- Where the kit changes a react-components element, it uses the kit class plus that
  element's stable class, such as `&.openui-button`: both sets of rules share one tag, so one
  class would tie with react-components' own and could lose.
- There are no global rules. Colours come from react-components' `ThemeProvider` (see
  Theming), and each component's root drops the `"wght"` variation a page may set on `body`,
  because the kit sets weights with `font-weight`.

A few rules are not flat, because the kit does not render the elements they reach: the
spacing system and card-sized type (the model's children), a Row's or Grid's children, a
Form's closing action, the photo row (which needs `!important` to beat inline styles), and
the rules over the DOM of KaTeX, maplibre and react-components' Checkbox, RadioItem and OptionCards.

As with react-components, styles are written in the browser: server-rendered HTML does not
include them yet, so the kit is unstyled until the page's JavaScript runs.

## Configuration

Two components reach a server: `SearchImage` (and `Image`, when its URL fails)
looks up photos, and `Map` draws street geometry between stops. In the source
app those are Next routes under the app's base path. The defaults are unchanged,
so an app already serving them needs no configuration:

```ts
import { configureIntelligentKit } from "@openuidev/intelligent-kit";

configureIntelligentKit({
  basePath: "/demo/intelligent-ui",
  endpoints: {
    wiki: (title) => `/my/wiki?title=${encodeURIComponent(title)}`,
    imageSearch: (q) => `/my/images?q=${encodeURIComponent(q)}`,
    streetRoute: (coords) => `/my/route?coords=${encodeURIComponent(coords)}`,
  },
});
```

Any subset may be replaced. Call it once, before rendering. Each route is a GET that
answers JSON:

| Endpoint      | Receives                                       | Answers                        |
| ------------- | ---------------------------------------------- | ------------------------------ |
| `wiki`        | an article title                               | `{ photos: [url, ...] }`       |
| `imageSearch` | a search query                                 | `{ images: [url, ...] }`       |
| `streetRoute` | stops as `lng,lat;lng,lat`, **longitude first** | `{ points: [[lat, lng], ...] }`, **latitude first** |

## Theming

The kit follows react-components' `ThemeProvider`, as react-components' own components do.
Light is the default; `mode="dark"` switches both:

```tsx
<ThemeProvider mode="dark">
  <Renderer response={program} library={library} />
</ThemeProvider>
```

Each colour reads a ThemeProvider token, so `lightTheme` and `darkTheme` restyle the kit with
the rest of the page:

| Kit colour | ThemeProvider token |
|---|---|
| ink (text, solid buttons, ticks) | `textNeutralPrimary` |
| muted text | `textNeutralSecondary` |
| canvas, and labels on ink | `foreground` |
| success, warning, danger, purple, pink | `textSuccessPrimary`, `textAlertPrimary`, `textDangerPrimary`, `textPurplePrimary`, `textPinkPrimary` |
| their soft tints (badges, callouts) | `successBackground`, `alertBackground`, `dangerBackground`, `purpleBackground`, `pinkBackground` |
| shadows | `shadowL`, `shadowS` |

Borders, surfaces, hover, focus and range tracks are mixed from ink and canvas where they are
used, so they follow too. Chart and confetti colours are a fixed six-colour palette that reads
in both modes: ThemeProvider's chart palettes are arrays for react-components' charts, not CSS
variables.

To change one kit colour alone, set its `--openui-intelligent-*` variable (listed in
`shared/tokens.ts`) anywhere above the output. The kit sets none of them itself:

```css
:root { --openui-intelligent-ink: #1d4ed8; }
```

Like react-components, the kit doesn't set the page's text colour or `color-scheme`. What it
leaves to inherit, such as `Text` and `Code`, takes the page's colour, so a dark page sets its
own, for example `body { color: var(--openui-text-neutral-primary); background: var(--openui-background); }`.

## What it registers

Root `Col`, 55 components in 6 groups, 59 `@functions`, 1 action
(`@CopyToClipboard`).

| Group | Components |
|---|---|
| Layout | `Col`, `Row`, `Box`, `Grid`, `Card`, `Carousel`, `Popover`, `Divider`, `Spacer` |
| Text | `Title`, `Text`, `Caption`, `Label`, `Badge`, `Link`, `List`, `ListItem`, `Markdown`, `Quote`, `Code`, `Math` |
| Inputs | `Button`, `IconButton`, `Pressable`, `Input`, `TextArea`, `Select`, `SegmentedControl`, `Slider`, `Checkbox`, `RadioGroup`, `DatePicker`, `Timer`, `Form` |
| Media and data | `SearchImage`, `Image`, `Icon`, `Table`, `Chart`, `Map`, `MapMarker`, `YouTube` |
| Play | `Flashcard`, `Celebration` |
| Drawing | `Svg`, `G`, `Circle`, `Ellipse`, `Rect`, `Line`, `Path`, `Polyline`, `Polygon`, `SvgText`, `HtmlView` |

## Relationship to the other kits

| | `chat-kit` | `dashboard-kit` | `intelligent-kit` |
|---|---|---|---|
| Its own components | 3 | 14 | 36 |
| Rendering peer | `react-components` | `react-components` | `react-components` |
| Root | `Card` | `Dashboard` | `Col` |
| Registered | 84 | 48 | 55 |
| `@functions` | — | — | 59 |
| Styling | goober | react-components' `css` | react-components' `css` |

## Parity with the source app

`library.toSpec()` has the same 55 components, 59 functions and one action as
open-intelligent-ui's committed `src/generated/spec.json`, with nothing extra or
missing. The two specs differ in only two ways:

- **Form validation, which this kit adds.** Input, TextArea, Select, Checkbox,
  RadioGroup and DatePicker take a `rules` prop, Form's description mentions it,
  and the Inputs group has one more note about it.
- **How zod writes a union, in 19 places.** It is `{"type": ["number","string"]}`
  in 4.6.6 (which generated the app's committed spec) and `anyOf` in 4.4.3 (this
  workspace's catalog). The meaning is the same, but spec bytes depend on the zod
  version, so don't compare them literally across versions.

## Note on strictness

The components and the library come from the source app, which compiles under
`strict` but not `noUncheckedIndexedAccess` or
`noPropertyAccessFromIndexSignature`. Those two flags are turned off for this
package only (`tsconfig.json`), so the code can track upstream without every
sync becoming a conflict. They remain on
for the other kits.

## Scripts

```sh
pnpm --filter @openuidev/intelligent-kit run build
pnpm --filter @openuidev/intelligent-kit run typecheck
pnpm --filter @openuidev/intelligent-kit run test          # fast: the library, the prompt, the style rules
pnpm --filter @openuidev/intelligent-kit run test:browser  # rendering, styles, layout and clicks in Chromium
pnpm --filter @openuidev/intelligent-kit run test:parity  # the kit against the real app; see src/__tests__/parity
pnpm --filter @openuidev/intelligent-kit run gallery      # every program, live
```
