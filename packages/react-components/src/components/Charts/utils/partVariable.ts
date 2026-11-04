import type React from "react";

/**
 * The private variable a shared part sets for the stable part class it is rendered with:
 * `--_openui-<component>-<part>-<property>`, e.g. `--_openui-bar-chart-group-opacity` for
 * `openui-bar-chart-group`. Shared parts (crosshairs, followers, animated paths) serve several
 * charts, so they read the owning chart's part from the class list instead of naming a chart.
 */
export const partVariable = (className: string | undefined, property: string) => {
  const part = className
    ?.split(/\s+/)
    .find((name) => name.startsWith("openui-") && !name.includes("--"));
  return part ? `--_${part}-${property}` : undefined;
};

/** Inline style setting `partVariable`s; empty when the class list carries no stable part. */
export const partVariables = (
  className: string | undefined,
  values: Record<string, string | number>,
): React.CSSProperties =>
  Object.fromEntries(
    Object.entries(values).flatMap(([property, value]) => {
      const variable = partVariable(className, property);
      return variable ? [[variable, value]] : [];
    }),
  );
