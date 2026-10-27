import { z } from "zod/v4";

import { Avatar } from "./Avatar";
import { AvatarStack } from "./AvatarStack";
import { Callout } from "./Callout";
import { CodeBlock } from "./CodeBlock";
import { EntityTitle } from "./EntityTitle";
import { Heading } from "./Heading";
import { Image } from "./Image";
import { ImageGallery } from "./ImageGallery";
import { ImageTitle } from "./ImageTitle";
import { LeadingText } from "./LeadingText";
import { Link } from "./Link";
import { Markdown } from "./Markdown";
import { Metric } from "./Metric";
import { Separator } from "./Separator";
import { Text } from "./Text";

import {
  AreaChartCondensed,
  BarChartCondensed,
  HorizontalBarChart,
  LineChartCondensed,
  PieChart,
  RadarChart,
  RadialChart,
  ScatterChart,
  SingleStackedBarChart,
} from "./Charts";

import { Buttons } from "./Buttons";
import { Checklist } from "./Checklist";
import { FollowUpBlock } from "./FollowUpBlock";
import { Form } from "./Form";
import { ListBlock } from "./ListBlock";
import { Steps } from "./Steps";
import { Table } from "./Table";
import { TagBlock } from "./TagBlock";
import { Timeline } from "./Timeline";

// Content allowed inside a SectionBlock section.
// Does NOT include SectionBlock (no nesting), Tabs, or Accordion (avoids circular deps).
export const SectionContentChildUnion = z.union([
  Text.ref,
  Markdown.ref,
  Link.ref,
  Metric.ref,
  Avatar.ref,
  AvatarStack.ref,
  Heading.ref,
  LeadingText.ref,
  EntityTitle.ref,
  ImageTitle.ref,
  Callout.ref,
  CodeBlock.ref,
  Image.ref,
  ImageGallery.ref,
  Separator.ref,
  HorizontalBarChart.ref,
  RadarChart.ref,
  PieChart.ref,
  RadialChart.ref,
  SingleStackedBarChart.ref,
  ScatterChart.ref,
  AreaChartCondensed.ref,
  BarChartCondensed.ref,
  LineChartCondensed.ref,
  Table.ref,
  TagBlock.ref,
  Form.ref,
  Buttons.ref,
  Steps.ref,
  Timeline.ref,
  Checklist.ref,
  ListBlock.ref,
  FollowUpBlock.ref,
]);
