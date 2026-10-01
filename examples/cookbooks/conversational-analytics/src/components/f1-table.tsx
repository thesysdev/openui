// Table in the F1 results style (formula1.com's classification tables), replacing OpenUI's Table.
// Same column-oriented Col API, plus a `start` slot: one component per row, drawn before the
// first column, so the agent can lead each row with a DriverAvatar or TeamLogo.
import { defineComponent } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import type { ReactNode } from "react";
import { z } from "zod/v4";
import "./f1-table.css";

const Col = openuiLibrary.components.Col;

type ColProps = { label?: string; data?: unknown; type?: "string" | "number" | "action" };

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v]);

export const Table = defineComponent({
  name: "Table",
  props: z.object({ columns: z.array(Col.ref), start: z.array(z.any()).optional() }),
  description:
    'Data table, column-oriented: each Col holds its own data array (type "number" right-aligns timing and points). start: optional components shown before the first column, one per row in row order, e.g. [DriverAvatar("RUS", "s"), DriverAvatar("LEC", "s")] or [TeamLogo("Mercedes", "s")].',
  component: ({ props, renderNode }) => {
    const cols = (props.columns ?? [])
      .filter((c) => c != null && (c as { props?: ColProps }).props)
      .map((c) => {
        const p = (c as { props: ColProps }).props;
        return { label: p.label ?? "", data: asArray(p.data), numeric: p.type === "number" };
      });
    const start = asArray(props.start);
    if (!cols.length) return null;
    const rows = Math.max(...cols.map((c) => c.data.length));
    const cell = (v: unknown): ReactNode =>
      typeof v === "object" && v !== null ? renderNode(v as Parameters<typeof renderNode>[0]) : String(v ?? "");
    const hasStart = start.length > 0;

    return (
      <div className="f1-table-wrap">
        <table className="f1-table">
          <thead>
            <tr>
              {hasStart && <th className="f1-table-start" aria-label="" />}
              {cols.map((c, i) => (
                <th key={i} className={c.numeric ? "f1-table-num" : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                {hasStart && <td className="f1-table-start">{start[r] != null ? cell(start[r]) : null}</td>}
                {cols.map((c, i) => (
                  <td key={i} className={[c.numeric && "f1-table-num", i === 0 && "f1-table-lead"].filter(Boolean).join(" ") || undefined}>
                    {cell(c.data[r])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
});
