import { z } from "zod";

import { Buttons } from "./components/buttons";
import { MarkDownRenderer } from "./components/markdown-renderer";
import { TextContent } from "./components/text-content";

export const ChatContentChildUnion = z.union([
  TextContent.ref,
  MarkDownRenderer.ref,
  Buttons.ref,
]);
