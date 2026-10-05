import { z } from "zod";

import { Alert } from "./components/alert";
import { Buttons } from "./components/buttons";
import { CardHeader } from "./components/card-header";
import {
  BarChartComponent,
  LineChartComponent,
  PieChartComponent,
} from "./components/charts";
import { Separator } from "./components/divider";
import { FollowUpBlock } from "./components/follow-up-block";
import { Form } from "./components/form";
import { Heading } from "./components/heading";
import { List } from "./components/list";
import { Progress } from "./components/progress";
import { Table } from "./components/table";
import { TextContent } from "./components/text-content";

/**
 * Components that may appear inside a container's `content` array (Card, Tabs,
 * Accordion). Tabs/Accordion themselves are intentionally excluded here to keep
 * nesting shallow — they are added to the Card child union in `index.tsx`.
 */
export const ContentChildUnion = z.union([
  CardHeader.ref,
  TextContent.ref,
  Heading.ref,
  Alert.ref,
  List.ref,
  Separator.ref,
  Progress.ref,
  Table.ref,
  BarChartComponent.ref,
  LineChartComponent.ref,
  PieChartComponent.ref,
  Form.ref,
  Buttons.ref,
]);

export const ChatContentChildUnion = z.union([...ContentChildUnion.options, FollowUpBlock.ref]);
