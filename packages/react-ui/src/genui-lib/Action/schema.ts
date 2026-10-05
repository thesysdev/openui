import { tagSchemaId } from "@openuidev/react-lang";
import { z } from "zod/v4";

/**
 * Shared action prop schema.
 *
 * Tagged as `ActionExpression` so the local react-lang prompt renders the v0.5
 * `Action([@steps...])` expression syntax. The JSON schema (used by `openui
 * generate` and cloud/muse prompt rendering) carries the legacy object
 * contract, which react-lang also accepts at runtime (legacy action path).
 */
export const actionPropSchema = z.union([
  z.object({ type: z.literal("open_url"), url: z.string() }),
  z.object({ type: z.literal("continue_conversation"), context: z.string().optional() }),
  z.object({ type: z.string(), params: z.record(z.string(), z.any()).optional() }),
]);
tagSchemaId(actionPropSchema, "ActionExpression");
