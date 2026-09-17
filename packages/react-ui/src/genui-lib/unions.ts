import { z } from "zod/v4";

import { Callout } from "./Callout";
import { CardHeader } from "./CardHeader";
import { CodeBlock } from "./CodeBlock";
import { Image } from "./Image";
import { ImageBlock } from "./ImageBlock";
import { ImageGallery } from "./ImageGallery";
import { MarkDownRenderer } from "./MarkDownRenderer";
import { Separator } from "./Separator";
import { TextCallout } from "./TextCallout";
import { TextContent } from "./TextContent";

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

import { Steps } from "./Steps";

import { FollowUpBlock } from "./FollowUpBlock";
import { ListBlock } from "./ListBlock";
import { SectionBlock } from "./SectionBlock";

import { CompositeCardBlock } from "./CompositeCardBlock";
import { ContextCardBlock } from "./ContextCardBlock";
import { EditableTable } from "./EditableTable";
import { EntityList } from "./EntityList";
import { InlineHeader } from "./InlineHeader";
import { OverviewCardBlock } from "./OverviewCardBlock";
import { SnippetCardBlock } from "./SnippetCardBlock";
import { VisualCardBlock } from "./VisualCardBlock";

export const ContentChildUnion = z.union([
  TextContent.ref,
  MarkDownRenderer.ref,
  CardHeader.ref,
  Callout.ref,
  TextCallout.ref,
  CodeBlock.ref,
  Image.ref,
  ImageBlock.ref,
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
  InlineHeader.ref,
  EntityList.ref,
  EditableTable.ref,
  SnippetCardBlock.ref,
  OverviewCardBlock.ref,
  ContextCardBlock.ref,
  CompositeCardBlock.ref,
  VisualCardBlock.ref,
]);

// Chat-specific content union — no Stack, adds ListBlock / FollowUpBlock / SectionBlock
// (conversational features with no place in the base library). Everything else
// (InlineHeader, EntityList, EditableTable, card blocks) now lives in the base
// ContentChildUnion above and is inherited here via the spread.
// Note: Tabs and Carousel are NOT included here to avoid circular deps (Tabs/schema.ts imports ContentChildUnion).
// ChatCardChildUnion (which adds Tabs + Carousel) is defined in openuiChatLibrary.tsx.
export const ChatContentChildUnion = z.union([
  ...ContentChildUnion.options,
  ListBlock.ref,
  FollowUpBlock.ref,
  SectionBlock.ref,
]);
