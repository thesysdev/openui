"use client";

import { createContext, useContext } from "react";

/**
 * The compiled class of each dashboard style block, by block name. The Dashboard provides it, so
 * a piece that renders outside the dashboard root (a popover in a portal) can carry the blocks it
 * needs. Empty outside a Dashboard.
 */
export const StyleClassesContext = createContext<Readonly<Record<string, string>>>({});

/** The classes of the named style blocks, joined for a className. */
export function useStyleClasses(...names: string[]): string {
  const classes = useContext(StyleClassesContext);
  return names.map((name) => classes[name] ?? "").join(" ");
}
