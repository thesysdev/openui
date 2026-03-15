import { z } from "zod";

/**
 * A fully defined model with name, schema, description, and a `.ref`
 * for type-safe cross-referencing in parent schemas.
 */
export interface Model<T extends z.ZodObject<any> = z.ZodObject<any>> {
  name: string;
  description: string;
  schema: T;
  /** Use in parent schemas: `z.array(ChildModel.ref)` */
  ref: T;
}

/**
 * Define a model with name, schema, and description.
 * Registers the Zod schema in `z.globalRegistry` with `{ id: name, description }`
 * so the prompt generator and sub-model auto-discovery can resolve model info.
 *
 * @example
 * ```ts
 * const LineItem = defineModel({
 *   name: "LineItem",
 *   description: "A single line item in an invoice",
 *   schema: z.object({
 *     description: z.string(),
 *     quantity: z.number(),
 *     unitPrice: z.number(),
 *   }),
 * });
 *
 * const Invoice = defineModel({
 *   name: "Invoice",
 *   description: "An invoice with line items",
 *   schema: z.object({
 *     invoiceNumber: z.string(),
 *     items: z.array(LineItem.ref),
 *   }),
 * });
 * ```
 */
export function defineModel<T extends z.ZodObject<any>>(config: {
  name: string;
  description: string;
  schema: T;
}): Model<T> {
  (config.schema as any).register(z.globalRegistry, {
    id: config.name,
    description: config.description,
  });
  return {
    ...config,
    ref: config.schema,
  };
}
