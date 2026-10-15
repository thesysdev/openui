import { Fragment, type ReactNode } from "react";
import { z } from "zod/v4";
import { InlineGroup } from "../components/InlineGroup";

/**
 * A slot that takes one of `options`, or an array of them. The agent passes
 * an array when a slot needs several pieces side by side (a price and a stock
 * Tag); renderOneOrMany lays it out as an inline row.
 */
export function oneOrMany<T extends readonly [z.core.$ZodType, ...z.core.$ZodType[]]>(
  ...options: T
) {
  const one = z.union(options as unknown as [z.core.$ZodType, z.core.$ZodType]);
  return z.union([...options, z.array(one)] as unknown as [z.core.$ZodType, z.core.$ZodType]);
}

/** Renders a oneOrMany value: strings as text, nodes as themselves, arrays inline. */
export function renderOneOrMany(
  value: unknown,
  renderNode: (node: unknown) => ReactNode,
): ReactNode | string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const items = value.filter((v) => v != null && v !== "");
    if (!items.length) return undefined;
    if (items.length === 1) return renderOneOrMany(items[0], renderNode);
    return (
      <InlineGroup>
        {items.map((item, i) =>
          typeof item === "string" ? (
            <span key={i}>{item}</span>
          ) : (
            <Fragment key={i}>{renderNode(item)}</Fragment>
          ),
        )}
      </InlineGroup>
    );
  }
  return renderNode(value);
}
