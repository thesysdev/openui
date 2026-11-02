/**
 * Normalize PascalCase/camelCase input to kebab-case candidates for
 * `lucide-react/dynamicIconImports` map keys. Unlike kebab → Pascal, this
 * direction is ambiguous around digits (`ArrowUp10` is `arrow-up-1-0`
 * upstream, but `Axis3d` is `axis-3d`). Dimension-shaped names add another
 * ambiguity (`Grid2x2` is exported as both `grid-2x2` and `grid-2-x-2`), so
 * callers try each deterministic candidate in priority order.
 */
export const toKebabIconCandidates = (name: string): string[] => {
  const base = name
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Za-z])(\d)/g, "$1-$2")
    .toLowerCase();
  const digitSplit = base.replace(/(\d)(?=\d)/g, "$1-");
  const compactDimension = base.replace(/(\d)x-(\d)/g, "$1x$2");
  const splitDimension = base.replace(/(\d)x-(\d)/g, "$1-x-$2");
  return [...new Set([base, digitSplit, compactDimension, splitDimension])];
};
