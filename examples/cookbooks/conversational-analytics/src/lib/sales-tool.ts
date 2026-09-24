import { openDatabase, querySales } from "./analytics";
import { months, salesQuerySchema } from "./query-args";

export function salesQueryTool(countries: string[]) {
  return {
    type: "function" as const,
    name: "query_sales",
    description:
      "Query real UCI retail sales for a country and month, with the prior month's totals, a daily trend, and the ten lowest product sales changes. Call this before answering a sales question. Read-only, server-owned SQL.",
    parameters: {
      type: "object",
      properties: {
        month: {
          type: "string",
          enum: months,
          description: "Calendar month in 2011, compared with the previous month.",
        },
        country: {
          type: "string",
          enum: countries,
          description: "Country in the dataset, or All countries.",
        },
      },
      required: ["month", "country"],
      additionalProperties: false,
    },
    strict: true,
  };
}

export async function executeSalesQuery(
  argsJson: string,
  { signal }: { signal?: AbortSignal } = {},
) {
  signal?.throwIfAborted();
  const args = salesQuerySchema.parse(JSON.parse(argsJson));
  const started = performance.now();
  const db = openDatabase();
  try {
    const result = querySales(db, args);
    return JSON.stringify({
      ...result,
      execution: {
        database: "SQLite",
        source: "UCI Online Retail",
        arguments: args,
        elapsedMs: Math.round(performance.now() - started),
      },
    });
  } finally {
    db.close();
  }
}
