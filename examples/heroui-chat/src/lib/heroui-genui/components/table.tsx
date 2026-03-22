"use client";

import { Table as HeroUITable } from "@heroui/react";
import { defineComponent } from "@openuidev/react-lang";
import type { ReactNode } from "react";
import { z } from "zod";

const ColSchema = z.object({
  label: z.string(),
  type: z.enum(["string", "number", "action"]).optional(),
});

export const Col = defineComponent({
  name: "Col",
  props: ColSchema,
  description: "Column definition",
  component: () => null,
});

/**
 * HeroUI / React Aria Table requires each body row to have exactly as many cells as
 * columns. While streaming, rows often arrive short (or over-long); normalize so the
 * collection never throws. Also avoids passing arbitrary objects to renderNode.
 */
function normalizeRowCells(row: unknown, columnCount: number): unknown[] {
  const raw = Array.isArray(row) ? row : row == null ? [] : [row];
  if (raw.length >= columnCount) {
    return raw.slice(0, columnCount);
  }
  return [...raw, ...Array(columnCount - raw.length).fill("")];
}

function renderPrimitiveCell(cell: unknown, renderNode: (value: unknown) => ReactNode): ReactNode {
  if (cell == null) return "";
  if (typeof cell === "string" || typeof cell === "number" || typeof cell === "boolean") {
    return String(cell);
  }
  if (typeof cell === "object" && (cell as { type?: string }).type === "element") {
    return renderNode(cell);
  }
  return "";
}

export const Table = defineComponent({
  name: "Table",
  props: z.object({
    columns: z.array(Col.ref),
    rows: z.array(z.array(z.union([z.string(), z.number(), z.boolean()]))),
  }),
  description: "Data table",
  component: ({ props, renderNode }) => {
    const columns = props.columns ?? [];
    const rows = props.rows ?? [];
    const columnCount = columns.length;

    if (!columnCount) return null;

    return (
      <HeroUITable>
        <HeroUITable.ScrollContainer>
          <HeroUITable.Content aria-label="Data table">
            <HeroUITable.Header>
              {columns.map((c, i) => (
                <HeroUITable.Column key={i} id={`col-${i}`} isRowHeader={i === 0}>
                  {c.props.label}
                </HeroUITable.Column>
              ))}
            </HeroUITable.Header>
            <HeroUITable.Body>
              {rows.map((row, ri) => {
                const cells = normalizeRowCells(row, columnCount);
                return (
                  <HeroUITable.Row key={ri} id={`row-${ri}`}>
                    {cells.map((cell, ci) => (
                      <HeroUITable.Cell key={ci} id={`cell-${ri}-${ci}`}>
                        {renderPrimitiveCell(cell, renderNode)}
                      </HeroUITable.Cell>
                    ))}
                  </HeroUITable.Row>
                );
              })}
            </HeroUITable.Body>
          </HeroUITable.Content>
        </HeroUITable.ScrollContainer>
      </HeroUITable>
    );
  },
});
