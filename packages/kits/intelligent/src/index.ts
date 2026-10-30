"use client";

// The stylesheets, so importing a component from here styles it. Listed in
// package.json "sideEffects" so bundlers keep them; hosts without a bundler
// can load dist/styles.css instead. The list and its order are the same as in
// lib/defineComponents.ts.
import "./shared/theme.css";
import "./lib/Badge/badge.css";
import "./components/Button/button.css";
import "./lib/IconButton/iconButton.css";
import "./components/Pressable/pressable.css";
import "./components/SegmentedControl/segmentedControl.css";
import "./components/Slider/slider.css";
import "./components/Timer/timer.css";
import "./components/Checkbox/checkbox.css";
import "./components/RadioGroup/radioGroup.css";
import "./components/Photo/photo.css";
import "./components/HtmlView/htmlView.css";
import "./components/Carousel/carousel.css";
import "./components/Popover/popover.css";
import "./components/Flashcard/flashcard.css";
import "./components/Celebration/celebration.css";
import "./components/Map/map.css";
import "./shared/shared.css";

// Host configuration: where Photo (SearchImage, Image) and Map fetch from.
export {
  configureIntelligentKit,
  endpoints,
  type IntelligentKitConfig,
  type IntelligentKitEndpoints,
} from "./shared/config";

// The kit's own React components, usable without openui-lang. The library's
// component definitions, which render them, are in ./lib.
export * from "./components/Box";
export * from "./components/Button";
export * from "./components/Caption";
export * from "./components/Card";
export * from "./components/Carousel";
export * from "./components/Celebration";
export * from "./components/Checkbox";
export * from "./components/Col";
export * from "./components/Field";
export * from "./components/Flashcard";
export * from "./components/Form";
export * from "./components/Grid";
export * from "./components/HtmlView";
export * from "./components/Icon";
export * from "./components/Link";
export * from "./components/List";
export * from "./components/Map";
export * from "./components/Markdown";
export * from "./components/Math";
export * from "./components/Photo";
export * from "./components/Popover";
export * from "./components/Pressable";
export * from "./components/Quote";
export * from "./components/RadioGroup";
export * from "./components/Row";
export * from "./components/SegmentedControl";
export * from "./components/Slider";
export * from "./components/Spacer";
export * from "./components/Svg";
export * from "./components/Text";
export * from "./components/Timer";
export * from "./components/Title";
export * from "./components/YouTube";
