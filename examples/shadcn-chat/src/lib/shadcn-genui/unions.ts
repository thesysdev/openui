import { z } from "zod";

import { Alert } from "./components/alert";
import { AlertDialogBlock } from "./components/alert-dialog-block";
import { ShadcnBadgeComponent } from "./components/badge";
import { Breadcrumb } from "./components/breadcrumb";
import { CalendarBlock } from "./components/calendar-block";
import { CodeBlock } from "./components/code-block";
import { DialogBlock } from "./components/dialog-block";
import { DrawerBlock } from "./components/drawer-block";
import { EmptyState } from "./components/empty-state";
import { FollowUpBlock } from "./components/follow-up-block";
import { HoverInfo } from "./components/hover-info";
import { Image, ImageBlock } from "./components/image";
import { Kbd } from "./components/kbd";
import { ListBlock } from "./components/list-block";
import { MarkDownRenderer } from "./components/markdown-renderer";
import { PaginationBlock } from "./components/pagination-block";
import { Progress } from "./components/progress";
import { SectionBlock } from "./components/section-block";
import { Separator } from "./components/separator";
import { Skeleton } from "./components/skeleton";
import { Spinner } from "./components/spinner";
import { TextContent } from "./components/text-content";
import { TooltipText } from "./components/tooltip-text";
import { Blockquote, Heading, InlineCode } from "./components/typography";

import {
  AreaChartCondensed,
  BarChartCondensed,
  LineChartCondensed,
  PieChartComponent,
  RadarChartComponent,
  RadialChartComponent,
  ScatterChartComponent,
} from "./components/charts";

import { Table } from "./components/table";
import { TagBlock } from "./components/tag";

import { Avatar } from "./components/avatar";
import { Buttons } from "./components/buttons";
import { CardHeader } from "./components/card-header";
import { Form } from "./components/form";

export const ContentChildUnion = z.union([
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
  DialogBlock.ref,
  AlertDialogBlock.ref,
  DrawerBlock.ref,
  CalendarBlock.ref,
]);

export const ChatContentChildUnion = z.union([
  ...ContentChildUnion.options,
  ListBlock.ref,
  FollowUpBlock.ref,
  SectionBlock.ref,
]);

export { SectionContentChildUnion } from "./section-content-union";
