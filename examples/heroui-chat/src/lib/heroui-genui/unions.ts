import { z } from "zod";

import { Buttons } from "./components/buttons";
import { Callout } from "./components/callout";
import { FollowUpBlock } from "./components/follow-up";
import { MarkDownRenderer } from "./components/markdown-renderer";
import { Separator } from "./components/separator";
import { Table } from "./components/table";
import { TagBlock } from "./components/tag";
import { TextContent } from "./components/text-content";

export const ContentChildUnion = z.union([
  TextContent.ref,
  MarkDownRenderer.ref,
  Callout.ref,
  Separator.ref,
  Table.ref,
  TagBlock.ref,
  Buttons.ref,
]);

export const ChatContentChildUnion = z.union([...ContentChildUnion.options, FollowUpBlock.ref]);
