"use client";

// The stylesheets, so the root entrypoint behaves like ./lib: importing a
// component from here styles it. Without this, `import { Card } from
// "@openuidev/intelligent-kit"` renders unstyled, because only library.ts
// pulls the sheets in. Listed in package.json "sideEffects" so bundlers keep
// them; non-bundler hosts can load dist/styles.css instead.
import "./lib/components/theme.css";
import "./lib/components/components.css";
import "./lib/components/Map/map.css";

// Host configuration: where SearchImage and Map fetch from.
export {
  configureIntelligentKit,
  endpoints,
  type IntelligentKitConfig,
  type IntelligentKitEndpoints,
} from "./lib/config";

// The components, so a host can compose its own library from a subset or add
// its own, exactly as the coach and chess libraries do in Open Intelligent UI.
export { Box } from "./lib/components/Box";
export { Card } from "./lib/components/Card";
export { Col } from "./lib/components/Col";
export { Grid } from "./lib/components/Grid";
export { Row } from "./lib/components/Row";
export { Spacer } from "./lib/components/Spacer";
export { Form } from "./lib/components/Form";
export { Divider } from "./lib/components/Divider";
export { Caption } from "./lib/components/Caption";
export { Link } from "./lib/components/Link";
export { Text } from "./lib/components/Text";
export { Title } from "./lib/components/Title";
export { List } from "./lib/components/List";
export { ListItem } from "./lib/components/ListItem";
export { Badge } from "./lib/components/Badge";
export { Label } from "./lib/components/Label";
export { Markdown } from "./lib/components/Markdown";
export { Pressable } from "./lib/components/Pressable";
export { Slider } from "./lib/components/Slider";
export { Timer } from "./lib/components/Timer";
export { SegmentedControl } from "./lib/components/SegmentedControl";
export { Button } from "./lib/components/Button";
export { IconButton } from "./lib/components/IconButton";
export { Input } from "./lib/components/Input";
export { TextArea } from "./lib/components/TextArea";
export { Select } from "./lib/components/Select";
export { Checkbox } from "./lib/components/Checkbox";
export { DatePicker } from "./lib/components/DatePicker";
export { RadioGroup } from "./lib/components/RadioGroup";
export { Carousel } from "./lib/components/Carousel";
export { Celebration } from "./lib/components/Celebration";
export { Flashcard } from "./lib/components/Flashcard";
export { MathBlock } from "./lib/components/Math";
export { Popover } from "./lib/components/Popover";
export { Quote } from "./lib/components/Quote";
export { YouTube } from "./lib/components/YouTube";
export { Code } from "./lib/components/Code";
export { Icon } from "./lib/components/Icon";
export { Image } from "./lib/components/Image";
export { SearchImage } from "./lib/components/SearchImage";
export { Chart } from "./lib/components/Chart";
export { Table } from "./lib/components/Table";
export { MapMarker } from "./lib/components/MapMarker";
export { MapView } from "./lib/components/Map";
export { svgComponents } from "./lib/components/svgComponents";
export { HtmlView } from "./lib/components/HtmlView";
