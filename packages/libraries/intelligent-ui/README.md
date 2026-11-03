# @openuidev/intelligent-ui-library

An OpenUI component library for Intelligent UI answers: primitives a model arranges itself, the
widgets it cannot draw (a street map, a sandboxed HTML page) and generic `@functions` so an answer
can compute with its own state.

## Install

```sh
pnpm add @openuidev/intelligent-ui-library
```

## Usage

Generate the system prompt with the CLI from a file that re-exports the library:

```ts
// src/lib/intelligent-ui-library.ts
export { library, promptOptions } from "@openuidev/intelligent-ui-library";
```

```sh
npx @openuidev/cli generate src/lib/intelligent-ui-library.ts --out src/generated/system-prompt.txt
```

Send that file as the system message, then render the model's response:

```tsx
import {
  IntelligentUiThemeProvider,
  library,
  runLibraryAction,
} from "@openuidev/intelligent-ui-library";
import { Renderer, type ActionEvent } from "@openuidev/react-lang";

export function IntelligentMessage({
  response,
  onAction,
}: {
  response: string;
  onAction: (event: ActionEvent) => void;
}) {
  return (
    <IntelligentUiThemeProvider mode="dark">
      <Renderer
        response={response}
        library={library}
        onAction={(event) => {
          // The kit's own action runs here; the rest are yours.
          if (runLibraryAction(event) === null) onAction(event);
        }}
      />
    </IntelligentUiThemeProvider>
  );
}
```

`IntelligentUiThemeProvider` is optional. It follows the outer `ThemeProvider`'s mode (light by
default) and takes `lightTheme` and `darkTheme` overrides. Wrap the `Renderer` in it so every
response gets the kit's theme, whatever its root.

### Actions

The `Renderer` hands every action a user takes to `onAction`. Most of them are yours to run:
`continue_conversation` sends a message back to the model, and `open_url` opens a link.

The kit adds one action of its own, `CopyToClipboard`. The model uses it for buttons like "Copy
list". A library action carries no code, so the kit exports `runLibraryAction` to run it. Call it
first in `onAction`:

- For `CopyToClipboard`, it copies the text and returns a promise of whether the copy worked.
- For any other action, it returns `null` and does nothing, so pass the event to your own handler.

Without `runLibraryAction`, a copy button does nothing.

### Server routes

Three components call routes on your server. The kit doesn't ship them: you serve them, and
`configureIntelligentKit` tells the kit where they are.

- `SearchImage` finds a photo for its query. `Image` searches the same way when its own URL fails.
  Both call `wiki` and `imageSearch` together and show the first photo that loads.
- `Map` calls `streetRoute` to draw a route along the streets between its stops.

Without a route, nothing breaks. `SearchImage`, and an `Image` whose URL fails, show an empty photo
placeholder. `Map` draws straight lines between the stops and says "Street routing unavailable".

By default the kit calls `/api/wiki`, `/api/image-search` and `/api/street-route`, under
`NEXT_PUBLIC_BASE_PATH` when a bundler inlines it. If you serve them there, no configuration is
needed. Otherwise call `configureIntelligentKit` once, before rendering. `basePath` moves all
three. `endpoints` replaces any of them.

```ts
import { configureIntelligentKit } from "@openuidev/intelligent-ui-library";

configureIntelligentKit({
  // The kit now calls /my-app/api/wiki and /my-app/api/image-search.
  basePath: "/my-app",
  // This one route is served somewhere else.
  endpoints: {
    streetRoute: (coords) => `/routing/street?coords=${encodeURIComponent(coords)}`,
  },
});
```

Each route answers JSON:

| Endpoint      | Receives                                        | Answers                                             |
| ------------- | ----------------------------------------------- | --------------------------------------------------- |
| `wiki`        | an article title                                | `{ photos: [url, ...] }`                            |
| `imageSearch` | a search query                                  | `{ images: [url, ...] }`                            |
| `streetRoute` | stops as `lng,lat;lng,lat`, **longitude first** | `{ points: [[lat, lng], ...] }`, **latitude first** |

## Components

`Col` is the root. 55 components in 6 groups:

| Group          | Components                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout         | `Col`, `Row`, `Box`, `Grid`, `Card`, `Carousel`, `Popover`, `Divider`, `Spacer`                                                                           |
| Text           | `Title`, `Text`, `Caption`, `Label`, `Badge`, `Link`, `List`, `ListItem`, `Markdown`, `Quote`, `Code`, `Math`                                             |
| Inputs         | `Button`, `IconButton`, `Pressable`, `Input`, `TextArea`, `Select`, `SegmentedControl`, `Slider`, `Checkbox`, `RadioGroup`, `DatePicker`, `Timer`, `Form` |
| Media and data | `SearchImage`, `Image`, `Icon`, `Table`, `Chart`, `Map`, `MapMarker`, `YouTube`                                                                           |
| Play           | `Flashcard`, `Celebration`                                                                                                                                |
| Drawing        | `Svg`, `G`, `Circle`, `Ellipse`, `Rect`, `Line`, `Path`, `Polyline`, `Polygon`, `SvgText`, `HtmlView`                                                     |
