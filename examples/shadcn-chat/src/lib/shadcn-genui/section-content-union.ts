import { z } from "zod";

import { Alert } from "./components/alert";
import { Avatar } from "./components/avatar";
import { ShadcnBadgeComponent } from "./components/badge";
import { CardHeader } from "./components/card-header";
import { CodeBlock } from "./components/code-block";
import { FollowUpBlock } from "./components/follow-up-block";
import { Image, ImageBlock } from "./components/image";
import { ListBlock } from "./components/list-block";
import { MarkDownRenderer } from "./components/markdown-renderer";
import { Progress } from "./components/progress";
import { Separator } from "./components/separator";
import { Skeleton } from "./components/skeleton";
import { TextContent } from "./components/text-content";

import {
  AreaChartCondensed,
  BarChartCondensed,
  LineChartCondensed,
  PieChartComponent,
  RadarChartComponent,
  RadialChartComponent,
  ScatterChartComponent,
} from "./components/charts";

import { Breadcrumb } from "./components/breadcrumb";
import { Buttons } from "./components/buttons";
import { CalendarBlock } from "./components/calendar-block";
import { EmptyState } from "./components/empty-state";
import { Form } from "./components/form";
import { HoverInfo } from "./components/hover-info";
import { Kbd } from "./components/kbd";
import { PaginationBlock } from "./components/pagination-block";
import { Spinner } from "./components/spinner";
import { Table } from "./components/table";
import { TagBlock } from "./components/tag";
import { TooltipText } from "./components/tooltip-text";
import { Blockquote, Heading, InlineCode } from "./components/typography";

export const SectionContentChildUnion = z.union([
  TextContent.ref,
  MarkDownRenderer.ref,
  CardHeader.ref,
  Alert.ref,
  ShadcnBadgeComponent.ref,
  Avatar.ref,
  CodeBlock.ref,
  Image.ref,
  ImageBlock.ref,
  Progress.ref,
  Skeleton.ref,
  Separator.ref,
  BarChartCondensed.ref,
  LineChartCondensed.ref,
  AreaChartCondensed.ref,
  PieChartComponent.ref,
  RadarChartComponent.ref,
  RadialChartComponent.ref,
  ScatterChartComponent.ref,
  Table.ref,
  TagBlock.ref,
  Form.ref,
  Buttons.ref,
  ListBlock.ref,
  FollowUpBlock.ref,
  Heading.ref,
  Blockquote.ref,
  InlineCode.ref,
  Spinner.ref,
  Kbd.ref,
  TooltipText.ref,
  HoverInfo.ref,
  Breadcrumb.ref,
  PaginationBlock.ref,
  EmptyState.ref,
  CalendarBlock.ref,
]);
