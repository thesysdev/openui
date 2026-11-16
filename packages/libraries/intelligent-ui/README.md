# @openuidev/intelligent-ui-library

An OpenUI component library for Intelligent UI answers: the components, `@functions`, prompt
options and examples a model uses to compose them.

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
import { ThemeProvider, library } from "@openuidev/intelligent-ui-library";
import { Renderer } from "@openuidev/react-lang";

export function IntelligentMessage({ response }: { response: string }) {
  return (
    <ThemeProvider mode="dark">
      <Renderer response={response} library={library} />
    </ThemeProvider>
  );
}
```

`ThemeProvider` is optional. It sets the mode and takes `lightTheme` and `darkTheme` overrides.
Without a mode it follows a react-components `ThemeProvider` around your app, or light without
one. In an OpenUI chat (`@openuidev/react-ui`), wrap the chat in `ThemeProvider` with the chat's
mode: the library can't read react-ui's theme.

`promptOptions` holds the generation rules and examples. To build your own options, spread its
`examples` and `additionalRules`, which are also exported on their own.

## Components

`Col` is the root. 52 components in 6 groups:

| Group          | Components                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout         | `Col`, `Row`, `Box`, `Grid`, `Card`, `Carousel`, `Popover`, `Divider`, `Spacer`                                                                           |
| Text           | `Title`, `Text`, `Caption`, `Label`, `Badge`, `Link`, `List`, `ListItem`, `Markdown`, `Quote`, `Code`, `Math`                                             |
| Inputs         | `Button`, `IconButton`, `Pressable`, `Input`, `TextArea`, `Select`, `SegmentedControl`, `Slider`, `Checkbox`, `RadioGroup`, `DatePicker`, `Timer`, `Form` |
| Media and data | `Image`, `Icon`, `Table`, `Chart`, `YouTube`                                                                                                              |
| Play           | `Flashcard`, `Celebration`                                                                                                                                |
| Drawing        | `Svg`, `G`, `Circle`, `Ellipse`, `Rect`, `Line`, `Path`, `Polyline`, `Polygon`, `SvgText`, `HtmlView`                                                     |

59 `@functions` let an answer compute with its own state; the generated system prompt lists them.
