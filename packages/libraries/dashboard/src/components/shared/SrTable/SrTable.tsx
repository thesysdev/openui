"use client";

export type SrTableProps = {
  caption: string;
  head: string[];
  rows: (string | number)[][];
};

/* ---------- Screen-reader table ---------- */

/**
 * A visually hidden data table rendered beside every SVG chart, so the data
 * is readable without the picture.
 */
export function SrTable({ caption, head, rows }: SrTableProps) {
  return (
    <table className="openui-dashboard-sr-only">
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
  );
}
