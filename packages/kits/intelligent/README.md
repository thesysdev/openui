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
`react`, `react-dom` and `zod` are peer dependencies. Like the chat and
dashboard kits, it draws with react-components where that has the component
(Button, Input, Select, Table, the charts, ...); the rest are the kit's own.

## Usage

```ts
import { library, promptOptions } from "@openuidev/intelligent-kit/lib";
```

The components bring their own styles, so there is nothing else to import. A
bundler is required: the kit imports `theme.css` and the sheets of maplibre-gl and
KaTeX.

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
  components/<Name>/                the kit's own React components, no openui-lang:
    <Name>.tsx  <name>.styles.ts  index.ts
  shared/                           what both halves need: theme.css (the tokens),
                                    tokens.ts, flow.styles.ts (the spacing system),
                                    style.ts (prop values to CSS), scheme.ts, config.ts
  lib/
    index.ts                        the library and every component definition
    <Name>/{index.tsx, schema.ts}   one binding per library component
    Svg/                            the drawing family, one file per shape
    defineComponents.ts             the definitions
    openuiIntelligentLibrary.ts     the library and its groups
    helpers.ts  controlHelpers.ts  mapPlaces.ts  actions.ts  functions/  prompt-options/
```

A binding maps the model's props onto components and draws no markup of its
own. Nine bind straight to react-components (`Chart`, `Code`, `DatePicker`,
`Divider`, `Input`, `Label`, `Select`, `Table`, `TextArea`); the rest render a
component from `src/components`, which holds whatever the kit draws itself: its
layout, text and media, the map, and the controls with their own look (`Badge`,
`Button`, `IconButton`, `SegmentedControl`, `Slider`, `Timer`, `Checkbox`,
`RadioGroup`, `Field`).

## Styling

Styles follow the same flat contract as `@openuidev/react-components`, and it needs
that package's flat-styles release ([#124](https://github.com/ankit-thesys/openui-comp/pull/124)):

- Every element has one generated class and one stable class. Each `<name>.styles.ts`
  exports them as `styles` and `names`, and all stable classes start with
  `openui-intelligent-`, so a plain class in your stylesheet can target and override them.
- Variants set private `--_openui-intelligent-*` variables that the parts read. States are
  attributes such as `aria-pressed`, `aria-checked`, `data-state` and `data-selected`.
- Every token has a fallback, so components still render without `theme.css` or a provider.
- Where the kit changes a react-components element, it uses the kit class plus that
  element's stable class, such as `&.openui-button`: react-components registers its rules
  at first render, so one class would tie and lose.
- `theme.css` is the one plain stylesheet: its selectors reach elements the kit does not
  class, such as a `data-theme` on your own element.

A few rules are not flat, because the kit does not render the elements they reach: the
spacing system and card-sized type (the model's children), a Row's or Grid's children, a
Form's closing action, the photo row (which needs `!important` to beat inline styles), and
the sheets over KaTeX's and maplibre's DOM.

On the server, `getComponentStyles()` from react-components collects the kit's styles
too. As with react-components, streaming SSR is not supported in first paint: the kit is
unstyled until the page's JavaScript runs.

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

Any subset may be replaced. Call it once, before rendering.

## Theming

Light is the default. Switch to dark with either attribute:

```html
<!-- on any ancestor of the rendered output -->
<div data-theme="dark">…</div>

<!-- or on the document, which is what AgentInterface sets -->
<html data-openui-theme="dark">
```

`data-theme` works on any element; `data-openui-theme` is matched as
`:root[data-openui-theme="dark"]`, so it only takes effect on `<html>`. Without an
OpenUI theme, either one also sets the `--openui-*` neutrals, at zero weight, so
react-components' controls go dark too and any theme of yours still wins.

Colours are CSS custom properties in `theme.css` (`--openui-intelligent-*`). Only the base
neutrals and the status, chart and map colours are set directly; borders,
surfaces, hover, focus and range tracks are derived from
`--openui-intelligent-ink` and `--openui-intelligent-canvas` with `color-mix`, so re-pointing those two
re-tunes the whole scale.

### With an OpenUI theme

The neutrals read through to the OpenUI theme variables:

```css
--openui-intelligent-ink: var(--openui-text-neutral-primary, #0d0d0d);
--openui-intelligent-canvas: var(--openui-foreground, #ffffff);
```

So in an app that already has an OpenUI theme — `AgentInterface` or
`ThemeProvider` from `@openuidev/react-ui`, or `--openui-*` set by hand — these
components pick it up and match the chat around them, in both modes.

Without one, the fallbacks apply, and they are correct in both modes: this kit
has no `@openuidev/react-ui` dependency, so `data-theme="dark"` alone gives a
fully dark surface. Set the OpenUI variables only when you want the components
to follow a theme you already have.

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
| Its own components | 3 | 14 | 35 |
| Rendering peer | `react-components` | `react-components` | `react-components` |
| Root | `Card` | `Dashboard` | `Col` |
| Registered | 84 | 48 | 55 |
| `@functions` | — | — | 59 |
| Styling | goober | goober | goober |

## Parity with the source app

`library.toSpec()` matches open-intelligent-ui's committed `src/generated/spec.json`:
the same 55 components, with nothing extra or missing.

The two JSON encodings differ in 38 places, all of them the same thing: zod
serialises a union as `{"type": ["number","string"]}` in 4.6.6 (which generated
the app's committed spec) and as `anyOf` in 4.4.3 (this workspace's catalog).
Normalising that encoding makes the two specs identical, with no semantic
difference. Spec bytes are therefore zod-version dependent and should not be
compared literally across versions.

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
```
