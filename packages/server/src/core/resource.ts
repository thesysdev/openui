import { invalidInput, invalidResponse } from "./errors";

/** How to make a call, apart from what it asks for. */
export interface RequestOptions {
  /** Cancels the call while it waits for OpenUI Cloud. */
  signal?: AbortSignal;
}

/** One page of a list. */
export interface CloudList<Row> {
  data: Row[];
  hasMore: boolean;
  firstId?: string;
  /** Pass as `after` for the next page. */
  lastId?: string;
}

/** One page of a list, as OpenUI Cloud sends it, with each row mapped by `toRow`. */
export function toList<Row>(
  page: Record<string, unknown>,
  toRow: (row: unknown) => Row,
): CloudList<Row> {
  if (!Array.isArray(page["data"])) throw invalidResponse();
  return {
    data: page["data"].map((row) => toRow(row)),
    hasMore: page["has_more"] === true,
    ...(typeof page["first_id"] === "string" && { firstId: page["first_id"] }),
    ...(typeof page["last_id"] === "string" && { lastId: page["last_id"] }),
  };
}

/** `value` as an id: a non-empty string, else an `invalid_input` error naming it. */
export function requireId(value: unknown, name: string): string {
  if (typeof value !== "string" || !value) invalidInput(`${name} is required`);
  return value;
}

/** `/v1/<collection>/<id><suffix>`, after checking the id. */
export function idPath(collection: string, id: unknown, suffix = ""): string {
  return `/v1/${collection}/${encodeURIComponent(requireId(id, "id"))}${suffix}`;
}

/** A number as a query string value, left out when it's undefined. */
export const queryNumber = (value: number | undefined) =>
  value === undefined ? undefined : String(value);
