"use client";

export type SrTableProps = {
  caption: string;
  head: string[];
  rows: (string | number)[][];
};

/* ---------- Screen-reader table ---------- */

/**
 * A visually hidden data table rendered beside every SVG chart, so the data
 * is readable without the picture. It's hidden by a box around it: a table
 * ignores the 1px size and grows to fit its rows, which would spill out of the
 * chart and make a scrolling ancestor scroll.
 */
export function SrTable({ caption, head, rows }: SrTableProps) {
  return (
    <div className="openui-dashboard-sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {head.map((label, keyIndex) => (
              <th key={`${keyIndex}-${label}`} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
