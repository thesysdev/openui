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

### Theming

`ThemeProvider` is optional. Without it, a response with a `Col` root wraps itself in a default
one, in the mode of the react-components `ThemeProvider` around your app, or light without one.

- `mode` is `"light"` or `"dark"`. A nested `ThemeProvider` without one takes its parent's.
- A nested `ThemeProvider`'s overrides apply on top of its parent's, so it changes only what it
  sets.
- `lightTheme` and `darkTheme` take partial overrides; without `darkTheme`, `lightTheme` applies to
  both modes. They take react-components' theme keys, which the components the library draws with
  (Button, Select, DatePicker, Chart and more) read, and the library's own `intelligent*` keys:
  `intelligentChart1` to `intelligentChart6`, spacing such as `intelligentSpaceGroup`, corner radius
  such as `intelligentRadiusLg`, and colours such as `intelligentInk`. Each sets the
  `--openui-intelligent-*` variable of the same name (`intelligentChart1` →
  `--openui-intelligent-chart-1`). An unset library colour follows react-components' colours.

```tsx
<ThemeProvider
  mode="dark"
  lightTheme={{ textSuccessPrimary: "#0a7d4f", intelligentChart1: "#6155e8" }}
>
  <Renderer response={response} library={library} />
</ThemeProvider>
```

`ThemeProvider` themes only what is inside it, never `body`, and carries its variables into the
menus and popovers that open outside it. Inside it, a react-components `ThemeProvider` around
your app changes nothing: the library takes its mode and keys from this one only.

It sets the theme's variables but doesn't paint your page. To give the response the theme's
background, put it in an element inside `ThemeProvider`, for example
`<div style={{ background: "var(--openui-background)" }}>`.

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
