import {
  getTableData,
  updateCells,
  addRows,
  deleteRows,
  setFormula,
  queryTable,
  addColumn,
  recalculateAggregates,
  CellValue,
} from "./tableStore";

let currentThreadId = "";

export function setCurrentThreadId(threadId: string) {
  currentThreadId = threadId;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const tools: any[] = [
  {
    type: "function",
    function: {
      name: "get_table_data",
      description:
        "Get the current table data including all cell values, formulas, and column headers. Call this first to see the current state of the spreadsheet.",
      parameters: { type: "object", properties: {}, required: [] },
      parse: JSON.parse,
      function: async () => {
        const result = getTableData(currentThreadId);
        return JSON.stringify({
          success: true,
          colHeaders: result.colHeaders,
          data: result.data,
          rowCount: result.data.length,
          colCount: result.colHeaders.length,
          message: `Table has ${result.data.length} rows and ${result.colHeaders.length} columns`,
        });
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_cells",
      description:
        "Update one or more cells in the table. Supports values (numbers, strings) or formulas (starting with =).",
      parameters: {
        type: "object",
        properties: {
          updates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                row: { type: "number", description: "Zero-based row index" },
                col: { type: "number", description: "Zero-based column index" },
                value: {
                  description: "Cell value: number, string, or formula starting with =",
                },
              },
              required: ["row", "col", "value"],
            },
            description: "Array of cell updates to apply",
          },
        },
        required: ["updates"],
      },
      parse: JSON.parse,
      function: async (args: {
        updates: { row: number; col: number; value: CellValue }[];
      }) => JSON.stringify(updateCells(currentThreadId, args.updates)),
    },
  },
  {
    type: "function",
    function: {
      name: "add_rows",
      description:
        "Add one or more new rows to the table. Each row is an array of cell values matching the column count. Use the 'position' parameter to insert before summary/formula rows (e.g., Total, Average). Formula references in existing rows auto-adjust when rows are inserted.",
      parameters: {
        type: "object",
        properties: {
          rows: {
            type: "array",
            items: { type: "array", items: {} },
            description: "Array of rows to add",
          },
          position: {
            type: "number",
            description: "Zero-based row index to insert at. Omit to append.",
          },
        },
        required: ["rows"],
      },
      parse: JSON.parse,
      function: async (args: { rows: CellValue[][]; position?: number }) =>
        JSON.stringify(addRows(currentThreadId, args.rows, args.position)),
    },
  },
  {
    type: "function",
    function: {
      name: "delete_rows",
      description: "Delete one or more rows from the table by their indices.",
      parameters: {
        type: "object",
        properties: {
          rowIndices: {
            type: "array",
            items: { type: "number" },
            description: "Zero-based row indices to delete",
          },
        },
        required: ["rowIndices"],
      },
      parse: JSON.parse,
      function: async (args: { rowIndices: number[] }) =>
        JSON.stringify(deleteRows(currentThreadId, args.rowIndices)),
    },
  },
  {
    type: "function",
    function: {
      name: "set_formula",
      description:
        "Set an Excel-like formula in a specific cell. Supports 386+ functions including SUM, AVERAGE, IF, VLOOKUP, etc.",
      parameters: {
        type: "object",
        properties: {
          row: { type: "number", description: "Zero-based row index" },
          col: { type: "number", description: "Zero-based column index" },
          formula: {
            type: "string",
            description: "Excel-like formula, e.g. =SUM(A1:A5)",
          },
        },
        required: ["row", "col", "formula"],
      },
      parse: JSON.parse,
      function: async (args: { row: number; col: number; formula: string }) =>
        JSON.stringify(
          setFormula(currentThreadId, args.row, args.col, args.formula)
        ),
    },
  },
  {
    type: "function",
    function: {
      name: "query_table",
      description:
        "Query the table to find rows matching a condition. Useful for filtering data.",
      parameters: {
        type: "object",
        properties: {
          columnIndex: {
            type: "number",
            description: "Zero-based column index to query",
          },
          operator: {
            type: "string",
            enum: ["=", "!=", ">", "<", ">=", "<=", "contains"],
            description: "Comparison operator",
          },
          value: { description: "Value to compare against" },
        },
        required: ["columnIndex", "operator", "value"],
      },
      parse: JSON.parse,
      function: async (args: {
        columnIndex: number;
        operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "contains";
        value: string | number;
      }) =>
        JSON.stringify(
          queryTable(
            currentThreadId,
            args.columnIndex,
            args.operator,
            args.value
          )
        ),
    },
  },
  {
    type: "function",
    function: {
      name: "add_column",
      description:
        "Add a new column to the table with the specified header name.",
      parameters: {
        type: "object",
        properties: {
          headerName: {
            type: "string",
            description: "Name for the new column header",
          },
          position: {
            type: "number",
            description: "Zero-based column index to insert at. Omit to append.",
          },
        },
        required: ["headerName"],
      },
      parse: JSON.parse,
      function: async (args: { headerName: string; position?: number }) =>
        JSON.stringify(
          addColumn(currentThreadId, args.headerName, args.position)
        ),
    },
  },
  {
    type: "function",
    function: {
      name: "recalculate_aggregates",
      description:
        "Recalculate all aggregate rows (Total, Average, Sum, Count, Max, Min) so their formulas cover the correct data range. ALWAYS call this after add_rows or delete_rows to keep totals and averages up to date.",
      parameters: { type: "object", properties: {}, required: [] },
      parse: JSON.parse,
      function: async () =>
        JSON.stringify(recalculateAggregates(currentThreadId)),
    },
  },
];
