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
  type IntelligentKitConfig,
  type IntelligentKitEndpoints,
} from "./lib/config";

// The components, so a host can compose its own library from a subset or add
// its own, exactly as the coach and chess libraries do in Open Intelligent UI.
export { Box, Card, Col, Grid, Row, Spacer } from "./lib/components/layout";
export { Form } from "./lib/components/Form";
export { Divider } from "./lib/components/Divider";
export { Caption, Link, Text, Title } from "./lib/components/text";
export { List } from "./lib/components/List";
export { ListItem } from "./lib/components/ListItem";
export { Badge } from "./lib/components/Badge";
export { Label } from "./lib/components/Label";
export { Markdown } from "./lib/components/Markdown";
export { Button, Pressable, SegmentedControl, Slider, Timer } from "./lib/components/controls";
export { IconButton } from "./lib/components/IconButton";
export { Input } from "./lib/components/Input";
export { TextArea } from "./lib/components/TextArea";
export { Select } from "./lib/components/Select";
export { Checkbox } from "./lib/components/Checkbox";
export { DatePicker } from "./lib/components/DatePicker";
export { RadioGroup } from "./lib/components/RadioGroup";
export { Carousel } from "./lib/components/Carousel";
export { Celebration, Flashcard, MathBlock, Popover, Quote, YouTube } from "./lib/components/extra";
export { Code } from "./lib/components/Code";
export { Icon } from "./lib/components/media";
export { Image } from "./lib/components/Image";
export { SearchImage } from "./lib/components/SearchImage";
export { Chart } from "./lib/components/Chart";
export { Table } from "./lib/components/Table";
export { MapMarker, MapView } from "./lib/components/map/map";
export { svgComponents } from "./lib/components/svg";
export { HtmlView } from "./lib/components/html-view";
