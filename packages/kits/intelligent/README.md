# @openuidev/intelligent-kit

An OpenUI component library for Intelligent UI answers: primitives a model arranges itself, the
widgets it cannot draw (a street map, a sandboxed HTML page) and generic `@functions` so an answer
can compute with its own state.

## Install

```sh
pnpm add @openuidev/intelligent-kit
```

## Usage

Generate the system prompt with the CLI from a file that re-exports the library:

```ts
// src/lib/intelligent-library.ts
export {
  openuiIntelligentLibrary as library,
  openuiIntelligentPromptOptions as promptOptions,
} from "@openuidev/intelligent-kit";
```

```sh
npx @openuidev/cli generate src/lib/intelligent-library.ts --out src/generated/system-prompt.txt
```

Send that file as the system message, then render the model's response:

```tsx
import {
  IntelligentThemeProvider,
  openuiIntelligentLibrary,
  runLibraryAction,
} from "@openuidev/intelligent-kit";
import { Renderer } from "@openuidev/react-lang";

export function IntelligentMessage({ response }: { response: string }) {
  return (
    <IntelligentThemeProvider mode="dark">
      <Renderer
        response={response}
        library={openuiIntelligentLibrary}
        onAction={(event) => void runLibraryAction(event)}
      />
    </IntelligentThemeProvider>
  );
}
```

`IntelligentThemeProvider` is optional. It follows the outer `ThemeProvider`'s mode (light by
default) and takes `lightTheme` and `darkTheme` overrides. Without it, a `Col` root applies the
kit's theme itself, but a response with any other root gets react-components' default colours.
`runLibraryAction` runs the kit's own `CopyToClipboard` action and returns `null` for any other
action.

`SearchImage`, `Image` and `Map` fetch from the host. Point them at your routes once, before
rendering:

```ts
import { configureIntelligentKit } from "@openuidev/intelligent-kit";

configureIntelligentKit({
  basePath: "/my-app",
  endpoints: {
    wiki: (title) => `/api/wiki?title=${encodeURIComponent(title)}`,
    imageSearch: (q) => `/api/image-search?q=${encodeURIComponent(q)}`,
    streetRoute: (coords) => `/api/street-route?coords=${encodeURIComponent(coords)}`,
  },
});
```

| Endpoint      | Receives                                        | Answers                                             |
| ------------- | ----------------------------------------------- | --------------------------------------------------- |
| `wiki`        | an article title                                | `{ photos: [url, ...] }`                            |
| `imageSearch` | a search query                                  | `{ images: [url, ...] }`                            |
| `streetRoute` | stops as `lng,lat;lng,lat`, **longitude first** | `{ points: [[lat, lng], ...] }`, **latitude first** |

## Components

`Col` is the root. 55 components in 6 groups:

| Group          | Components                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout         | `Col`, `Row`, `Box`, `Grid`, `Card`, `Carousel`, `Popover`, `Divider`, `Spacer`                                                             |
| Text           | `Title`, `Text`, `Caption`, `Label`, `Badge`, `Link`, `List`, `ListItem`, `Markdown`, `Quote`, `Code`, `Math`                               |
| Inputs         | `Button`, `IconButton`, `Pressable`, `Input`, `TextArea`, `Select`, `SegmentedControl`, `Slider`, `Checkbox`, `RadioGroup`, `DatePicker`, `Timer`, `Form` |
| Media and data | `SearchImage`, `Image`, `Icon`, `Table`, `Chart`, `Map`, `MapMarker`, `YouTube`                                                             |
| Play           | `Flashcard`, `Celebration`                                                                                                                  |
| Drawing        | `Svg`, `G`, `Circle`, `Ellipse`, `Rect`, `Line`, `Path`, `Polyline`, `Polygon`, `SvgText`, `HtmlView`                                       |
