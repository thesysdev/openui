"use client";

// The stylesheets, so the root entrypoint behaves like ./lib: importing a
// component from here styles it. Without this, `import { Card } from
// "@openuidev/intelligent-kit"` renders unstyled, because only library.ts
// pulls the sheets in. Listed in package.json "sideEffects" so bundlers keep
// them; non-bundler hosts can load dist/styles.css instead.
import "./lib/components/theme.css";
import "./lib/components/components.css";
import "./lib/components/map/map.css";

// Host configuration: where SearchImage and Map fetch from.
export {
  configureIntelligentKit,
  endpoints,
  withBase,
  type IntelligentKitConfig,
  type IntelligentKitEndpoints,
} from "./lib/config";

// The components, so a host can compose its own library from a subset or add
// its own, exactly as the coach and chess libraries do in Open Intelligent UI.
export { Box, Card, Col, Divider, Form, Grid, Row, Spacer } from "./lib/components/layout";
export { Badge, Caption, Label, Link, List, ListItem, Markdown, Text, Title } from "./lib/components/text";
export {
  Button,
  Checkbox,
  DatePicker,
  IconButton,
  Input,
  Pressable,
  RadioGroup,
  SegmentedControl,
  Select,
  Slider,
  TextArea,
  Timer,
} from "./lib/components/controls";
export { Carousel, Celebration, Code, Flashcard, MathBlock, Popover, Quote, YouTube } from "./lib/components/extra";
export { Icon, Image, SearchImage } from "./lib/components/media";
export { Chart } from "./lib/components/chart";
export { Table } from "./lib/components/table";
export { MapMarker, MapView } from "./lib/components/map/map";
export { svgComponents } from "./lib/components/svg";
export { HtmlView } from "./lib/components/html-view";
