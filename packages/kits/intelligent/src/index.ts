"use client";

// The stylesheets, so the root entrypoint behaves like ./lib: importing a
// component from here styles it. Without this, `import { Card } from
// "@openuidev/intelligent-kit"` renders unstyled, because only library.ts
// pulls the sheets in. Listed in package.json "sideEffects" so bundlers keep
// them; non-bundler hosts can load dist/styles.css instead. The list and its
// order are the same as in src/lib/library.ts.
import "./lib/components/theme.css";
import "./lib/components/Col/col.css";
import "./lib/components/Row/row.css";
import "./lib/components/Grid/grid.css";
import "./lib/components/Spacer/spacer.css";
import "./lib/components/Card/card.css";
import "./lib/components/Form/form.css";
import "./lib/components/Title/title.css";
import "./lib/components/Text/text.css";
import "./lib/components/Caption/caption.css";
import "./lib/components/controlHelpers.css";
import "./lib/components/Link/link.css";
import "./lib/components/Badge/badge.css";
import "./lib/components/Icon/icon.css";
import "./lib/components/List/list.css";
import "./lib/components/markdownBlocks.css";
import "./lib/components/Markdown/markdown.css";
import "./lib/components/Button/button.css";
import "./lib/components/IconButton/iconButton.css";
import "./lib/components/Pressable/pressable.css";
import "./lib/components/SegmentedControl/segmentedControl.css";
import "./lib/components/Slider/slider.css";
import "./lib/components/Timer/timer.css";
import "./lib/components/Checkbox/checkbox.css";
import "./lib/components/RadioGroup/radioGroup.css";
import "./lib/components/photo.css";
import "./lib/components/Svg/svg.css";
import "./lib/components/HtmlView/htmlView.css";
import "./lib/components/Carousel/carousel.css";
import "./lib/components/Popover/popover.css";
import "./lib/components/Quote/quote.css";
import "./lib/components/Math/math.css";
import "./lib/components/YouTube/youTube.css";
import "./lib/components/Flashcard/flashcard.css";
import "./lib/components/Celebration/celebration.css";
import "./lib/components/Map/map.css";
import "./lib/components/shared.css";

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
export { ListItem } from "./lib/components/List";
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
export { MapMarker } from "./lib/components/Map";
export { MapView } from "./lib/components/Map";
export { svgComponents } from "./lib/components/Svg";
export { HtmlView } from "./lib/components/HtmlView";
