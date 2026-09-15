import { z } from "zod/v4";

import { CodeBlock } from "../CodeBlock";
import { Image } from "../Image";
import { ImageBlock } from "../ImageBlock";
import { MarkDownRenderer } from "../MarkDownRenderer";
import { TextContent } from "../TextContent";

// Content allowed inside a StepsItem's details.
// Kept narrower than SectionContentChildUnion: procedural steps need prose,
// code, and images — and referencing Steps here would be circular.
export const StepsItemDetailsChildUnion = z.union([
  TextContent.ref,
  MarkDownRenderer.ref,
  CodeBlock.ref,
  Image.ref,
  ImageBlock.ref,
]);

export const StepsItemSchema = z.object({
  title: z.string(),
  details: z.union([z.string(), z.array(StepsItemDetailsChildUnion)]),
});
