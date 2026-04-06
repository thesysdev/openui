import { z } from "zod";

/** Shared action prop schema — shows as `ActionExpression` in prompt signatures. */
export const actionPropSchema = z.any();
actionPropSchema.register(z.globalRegistry, { id: "ActionExpression" });
