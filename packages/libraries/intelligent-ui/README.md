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
import { library, ThemeProvider } from "@openuidev/intelligent-ui-library";
import { Renderer, type ActionEvent } from "@openuidev/react-lang";

export function IntelligentMessage({
  response,
  onAction,
}: {
  response: string;
  onAction: (event: ActionEvent) => void;
}) {
  return (
    <ThemeProvider mode="dark">
      <Renderer response={response} library={library} onAction={onAction} />
    </ThemeProvider>
  );
}
```

`ThemeProvider` is optional. It sets the mode (light by default)
and takes `lightTheme` and `darkTheme` overrides. Without it, a response with a `Col` root uses the
light default theme.

`ThemeProvider` sets the theme's colour variables but doesn't paint your page. Give the page the
theme's background, for example `body { background: var(--openui-background); }`, so a dark
theme's text sits on a dark page.

### Actions

The `Renderer` hands every action a user takes to `onAction`, and your app runs them:
`continue_conversation` sends a message back to the model, and `open_url` opens a link.

To give the model an action of your own, such as copying text, define it and add it to the library
with `library.extend({ actions: { add: [yourAction] } })`. The generated system prompt then lists
it, and its events reach `onAction` too. See
[Actions](https://openui.com/docs/openui-lang/actions) in the OpenUI docs.

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

The library also has 59 `@functions` that let an answer compute with its own state. The generated
system prompt lists them all.
