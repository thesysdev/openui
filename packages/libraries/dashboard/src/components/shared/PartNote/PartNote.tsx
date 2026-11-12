"use client";

import { type ReactNode } from "react";

export type PartNoteProps = { children: ReactNode };

/** Rows a chart had to leave out (a missing value), named, like seriesNote for series. */
export function rowsNote(names: string[]) {
  if (!names.length) return null;
  return (
    <PartNote>
      {names.length === 1
        ? `1 row couldn’t be drawn: ${names[0]}`
        : `${names.length} rows couldn’t be drawn: ${names.join(", ")}`}
    </PartNote>
  );
}

/** For part-to-whole charts: parts at zero or below have no share to draw, so they are named rather than dropped silently. */
export function partsNote(names: string[]) {
  if (!names.length) return null;
  return (
    <PartNote>
      {names.length === 1
        ? `1 part not drawn, zero or below: ${names[0]}`
        : `${names.length} parts not drawn, zero or below: ${names.join(", ")}`}
    </PartNote>
  );
}

/** A small alert for notes inside a drawn component. */
const NoteIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    aria-hidden
  >
    <circle cx="8" cy="8" r="6" />
    <path d="M8 5v3.4" />
    <circle cx="8" cy="10.9" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

/** A note under a drawn component when part of it couldn't be drawn, e.g. "1 series couldn't be drawn: Online". */
export function PartNote({ children }: PartNoteProps) {
  return (
    <p className="openui-dashboard-part-note" role="note">
      <NoteIcon />
      <span>{children}</span>
    </p>
  );
}

export function seriesNote(names: string[]) {
  if (!names.length) return null;
  return (
    <PartNote>
      {names.length === 1
        ? `1 series couldn’t be drawn: ${names[0]}`
        : `${names.length} series couldn’t be drawn: ${names.join(", ")}`}
    </PartNote>
  );
}
