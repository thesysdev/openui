import type { ReactNode } from "react";
import { z } from "zod/v4";
import { inline } from "./markdownBlocks";
import { children } from "./style";

/** A slot that takes a component, a list of them, or plain text. */
export const slot = z.union([z.string(), children]);

export type Render = (value: unknown) => ReactNode;

export const renderSlot = (value: unknown, renderNode: Render) =>
  typeof value === "string" || typeof value === "number" ? inline(String(value)) : renderNode(Array.isArray(value) ? value.flat() : value);
