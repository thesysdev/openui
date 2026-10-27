"use client";

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
