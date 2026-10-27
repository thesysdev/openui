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

import { IconButton } from "./IconButton";
import { Table } from "./Table";
import { TagBlock } from "./TagBlock";

import { Buttons } from "./Buttons";
import { Form } from "./Form";

import { Checklist } from "./Checklist";
import { Steps } from "./Steps";
import { Timeline } from "./Timeline";

import { FollowUpBlock } from "./FollowUpBlock";
import { ListBlock } from "./ListBlock";
import { SectionBlock } from "./SectionBlock";

import { CompositeCardBlock } from "./CompositeCardBlock";
import { EditableTable } from "./EditableTable";
import { EntityList } from "./EntityList";
import { ImageCard } from "./ImageCard";
import { InsightCard } from "./InsightCard";
import { ValueCard } from "./ValueCard";
import { ValueLayout } from "./ValueLayout";

export const ContentChildUnion = z.union([
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
  IconButton.ref,
  Steps.ref,
  Timeline.ref,
  Checklist.ref,
  EntityList.ref,
  EditableTable.ref,
  ValueCard.ref,
  ValueLayout.ref,
  InsightCard.ref,
  CompositeCardBlock.ref,
  ImageCard.ref,
]);

// Chat-specific content union — no Stack, adds ListBlock / FollowUpBlock / SectionBlock
// (conversational features with no place in the base library). Everything else
// (EntityList, EditableTable, card blocks) now lives in the base
// ContentChildUnion above and is inherited here via the spread.
// Note: Tabs and Carousel are NOT included here to avoid circular deps (Tabs/schema.ts imports ContentChildUnion).
// ChatCardChildUnion (which adds Tabs + Carousel) is defined in openuiChatLibrary.tsx.
export const ChatContentChildUnion = z.union([
  ...ContentChildUnion.options,
  ListBlock.ref,
  FollowUpBlock.ref,
  SectionBlock.ref,
]);
