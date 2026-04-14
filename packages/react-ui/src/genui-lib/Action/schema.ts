import { tagSchemaId } from "@openuidev/react-lang";
import { z } from "zod/v4";

/** Shared action prop schema — shows as `ActionExpression` in prompt signatures. */
export const actionPropSchema = z.any();
tagSchemaId(actionPropSchema, "ActionExpression");
