import { z } from "zod";

/**
 * Plain object type — unlike react-lang's SubComponentOf which wraps in
 * an ElementNode, SubTypeOf is just the inferred Zod type directly.
 */
export type SubTypeOf<P> = P;

/**
 * A fully defined type with name, schema, description, and a `.ref`
 * for type-safe cross-referencing in parent schemas.
 */
export interface DefinedType<T extends z.ZodObject<any> = z.ZodObject<any>> {
  name: string;
  description: string;
  props: T;
  /** Use in parent schemas: `z.array(ChildType.ref)` */
  ref: z.ZodType<SubTypeOf<z.infer<T>>>;
}

/**
 * Define a type with name, schema, and description.
 * Registers the Zod schema in `z.globalRegistry` with `{ id: name }`
 * so the prompt generator can resolve type names.
 *
 * @example
 * ```ts
 * const LineItem = defineType({
 *   name: "LineItem",
 *   description: "A single line item in an invoice",
 *   props: z.object({
 *     description: z.string(),
 *     quantity: z.number(),
 *     unitPrice: z.number(),
 *   }),
 * });
 *
 * const Invoice = defineType({
 *   name: "Invoice",
 *   description: "An invoice with line items",
 *   props: z.object({
 *     invoiceNumber: z.string(),
 *     items: z.array(LineItem.ref),
 *   }),
 * });
 * ```
 */
export function defineType<T extends z.ZodObject<any>>(config: {
  name: string;
  description: string;
  props: T;
}): DefinedType<T> {
  (config.props as any).register(z.globalRegistry, { id: config.name });
  return {
    ...config,
    ref: config.props as unknown as z.ZodType<SubTypeOf<z.infer<T>>>,
  };
}
