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

`@openuidev/react-lang`, `@openuidev/lang-core`, `react`, `react-dom` and `zod`
are peer dependencies. Unlike the chat and dashboard kits, this one **ships its
own components**, so it does not depend on `@openuidev/react-components`.

## Usage

```ts
import { library, promptOptions } from "@openuidev/intelligent-kit/lib";
```

Both entrypoints pull the stylesheets in, so under a bundler the components are
styled with no extra import. Hosts without a bundler can load the concatenated
sheet instead, which also carries maplibre-gl's own stylesheet so `Map` is
styled:

```ts
import "@openuidev/intelligent-kit/styles.css";
```

```tsx
<Renderer response={program} library={library} />
```

- `/lib` exports `library`, `baseComponents`, `baseComponentGroups`,
  `promptOptions`, `dashboardPromptOptions`, `functions`, `actions`,
  `runLibraryAction`, the four worked examples and `demoToolSpecs` (the Query
  tool specs `dashboardPromptOptions` advertises to a model).
- The root entrypoint exports every component definition (so a host can compose
  its own library from a subset, or extend this one) and the kit configuration.

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
`:root[data-openui-theme="dark"]`, so it only takes effect on `<html>`.

Colours are CSS custom properties in `theme.css` (`--iui-*`). Only the base
neutrals and the status, chart and map colours are set directly; borders,
surfaces, hover, focus and range tracks are derived from
`--iui-ink` and `--iui-canvas` with `color-mix`, so re-pointing those two
re-tunes the whole scale.

### With an OpenUI theme

The neutrals read through to the OpenUI theme variables:

```css
--iui-ink: var(--openui-text-neutral-primary, #0d0d0d);
--iui-canvas: var(--openui-foreground, #ffffff);
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
| Components | registry only | registry only | **ships its own** |
| Rendering peer | `react-components` | `react-components` | none |
| Root | `Card` | `Stack` | `Col` |
| Registered | 84 | 82 | 55 |
| `@functions` | — | — | 59 |
| Styling | goober | goober | CSS files |

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

`src/lib` is vendored from the source app, which compiles under `strict` but not
`noUncheckedIndexedAccess` or `noPropertyAccessFromIndexSignature`. Those two
flags are turned off for this package only (`tsconfig.json`), so the vendored
code can track upstream without every sync becoming a conflict. They remain on
for the other kits.

## Scripts

```sh
pnpm --filter @openuidev/intelligent-kit run build
pnpm --filter @openuidev/intelligent-kit run typecheck
```
