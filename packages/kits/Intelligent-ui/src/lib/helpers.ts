/**
 * Pieces the components' schemas share, and the helpers that turn the model's
 * prop values into what the kit's components take.
 */
import { tagSchemaId, type ElementNode } from "@openuidev/react-lang";
import type { ReactNode } from "react";
import { z } from "zod/v4";
import { inline } from "../components/Markdown/markdownBlocks";

// Shared prop schemas
/** Children slot: any component, or a list of them (from @Each). Printed as `Node[]`. */
const node = z.any();
tagSchemaId(node, "Node");
export const children = z.array(node);

/** A token or a CSS color. Printed once as `Color` and explained in the prompt notes. */
export const color = z.string();
tagSchemaId(color, "Color");

/** A px number or a CSS length such as "50%". Printed as `Length`. */
export const length = z.union([z.number(), z.string()]);
tagSchemaId(length, "Length");

export const radiusSchema = z.union([z.enum(["sm", "md", "lg", "xl", "full"]), z.number()]);
tagSchemaId(radiusSchema, "Radius");
/** How a photo fills its box: Image and SearchImage. */
export const fitSchema = z.enum(["cover", "contain"]);
/**
 * A field's validation inside a Form, checked before anything is sent to the
 * assistant. The same shape as the chat and dashboard kits' rules, so a model
 * writes one format for all three: {required: true, min: 1, email: true}.
 */
export const rulesSchema = z.object({
  required: z.boolean().optional(),
  email: z.boolean().optional(),
  url: z.boolean().optional(),
  numeric: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
});
tagSchemaId(rulesSchema, "Rules");

export const option = z.union([z.string(), z.object({ value: z.string(), label: z.string() })]);
export type Option = z.infer<typeof option>;
export const toOption = (o: Option) => (typeof o === "string" ? { value: o, label: o } : o);

export const align = z.enum(["start", "center", "end", "stretch"]);

export const justify = z.enum(["start", "center", "end", "between"]);

/** A slot that takes a component, a list of them, or plain text. */
export const slot = z.union([z.string(), children]);

export type Render = (value: unknown) => ReactNode;

export const renderSlot = (value: unknown, renderNode: Render) =>
  typeof value === "string" || typeof value === "number" ? inline(String(value)) : renderNode(Array.isArray(value) ? value.flat() : value);

/** A component in a prop's value, as opposed to plain text or a number. */
export const isElement = (value: unknown): value is ElementNode =>
  !!value && typeof value === "object" && (value as { type?: unknown }).type === "element";
