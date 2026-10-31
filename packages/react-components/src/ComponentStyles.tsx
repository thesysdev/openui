"use client";

import { getComponentStyles } from "./styles";

export type ComponentStylesProps = {
  /** Cascade layer for the component rules, as in `@layer theme, base, openui, …`. */
  layer?: string;
};

/**
 * The whole component sheet as one `<style>` in <head>, for server-rendered apps. A client
 * component, so the sheet travels in the HTML only, not in a React Server Components payload;
 * React keeps the server's tag on hydration (same `href`) and never writes it again.
 */
export function ComponentStyles({ layer }: ComponentStylesProps) {
  return (
    <style href="openui-styles" precedence="openui">
      {getComponentStyles({ layer })}
    </style>
  );
}
