import { NextResponse } from "next/server";

export const notFound = (entity = "Resource") =>
  NextResponse.json({ error: `${entity} not found`, status: 404 }, { status: 404 });

export const badRequest = (message: string) =>
  NextResponse.json({ error: message, status: 400 }, { status: 400 });

export const created = <T>(payload: T) => NextResponse.json(payload, { status: 201 });

export const asNumber = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

export const applyCursorPagination = <T>(items: T[], first?: number, after?: string) => {
  const start = after ? Number.parseInt(after.replace("cursor_", ""), 10) + 1 : 0;
  const safeStart = Number.isFinite(start) && start >= 0 ? start : 0;
  const pageSize = typeof first === "number" && first > 0 ? first : items.length;
  const nodes = items.slice(safeStart, safeStart + pageSize);
  const endIndex = safeStart + nodes.length - 1;
  const hasNextPage = endIndex < items.length - 1;
  const endCursor = nodes.length ? `cursor_${endIndex}` : null;

  return {
    nodes,
    pageInfo: {
      hasNextPage,
      endCursor,
    },
  };
};

export const sortByOrder = <T>(
  items: T[],
  orderBy: string | null,
  accessor: (item: T) => string | number,
) => {
  const sorted = [...items];
  const desc = orderBy?.toLowerCase().endsWith("_desc");
  sorted.sort((a, b) => {
    const av = accessor(a);
    const bv = accessor(b);
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
  return sorted;
};
