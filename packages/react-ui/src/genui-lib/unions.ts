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

import { Table } from "./Table";
import { TagBlock } from "./TagBlock";

import { Buttons } from "./Buttons";
import { Form } from "./Form";

import { Steps } from "./Steps";

import { FollowUpBlock } from "./FollowUpBlock";
import { ListBlock } from "./ListBlock";
import { SectionBlock } from "./SectionBlock";

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
  Steps.ref,
]);

// Chat-specific content union — no Stack, adds ListBlock / FollowUpBlock / SectionBlock
// Note: Tabs and Carousel are NOT included here to avoid circular deps (Tabs/schema.ts imports ContentChildUnion).
// ChatCardChildUnion (which adds Tabs + Carousel) is defined in openuiChatLibrary.tsx.
export const ChatContentChildUnion = z.union([
  ...ContentChildUnion.options,
  ListBlock.ref,
  FollowUpBlock.ref,
  SectionBlock.ref,
]);
