---
"@openuidev/intelligent-ui-library": minor
---

First release of the Intelligent UI component library: 52 components in 6 groups that a model composes into interactive answers, with `Col` as the root. Layout (Col, Row, Box, Grid, Card, Carousel, Popover), text (Title, Text, Markdown, Code, Math and more), inputs (Button, Input, Select, Slider, DatePicker, Timer, Form and more), media and data (Image, Icon, Table, Chart, YouTube), play (Flashcard, Celebration) and drawing (Svg shapes and a sandboxed HtmlView). 59 `@functions` let an answer compute with its own `$variables` without a round trip to the model. `promptOptions` carries generation rules and examples, and the library's own `ThemeProvider` themes it in light or dark mode, with react-components' keys and its own `intelligent*` keys, scoped to what it wraps; without one, a response's root `Col` brings a default.
