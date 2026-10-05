export type CellValue = string | number | null;
export type TableData = CellValue[][];

export interface TableState {
  data: TableData;
  colHeaders: string[];
}

const DEFAULT_TABLE_STATE: TableState = {
  colHeaders: [
    "Product",
    "Category",
    "Q1 Revenue",
    "Q2 Revenue",
    "Q3 Revenue",
    "Q4 Revenue",
    "Annual Revenue",
    "Units Sold",
    "Unit Price",
  ],
  data: [
    ["MacBook Pro 16\"", "Laptops", 48500, 52300, 61200, 74800, "=SUM(C1:F1)", 320, 2499],
    ["iPhone 15 Pro", "Phones", 125000, 98700, 112400, 185600, "=SUM(C2:F2)", 4200, 999],
    ["AirPods Pro", "Audio", 32400, 28900, 35100, 52800, "=SUM(C3:F3)", 8800, 249],
    ["iPad Air", "Tablets", 21800, 24500, 19600, 38200, "=SUM(C4:F4)", 1560, 599],
    ["Apple Watch Ultra", "Wearables", 18200, 21400, 25800, 31600, "=SUM(C5:F5)", 980, 799],
    ["Mac Mini", "Desktops", 15600, 17200, 14800, 22400, "=SUM(C6:F6)", 620, 599],
    ["HomePod Mini", "Audio", 8400, 7200, 9600, 18500, "=SUM(C7:F7)", 3700, 99],
    ["AirTag 4-Pack", "Accessories", 6200, 5800, 7400, 14200, "=SUM(C8:F8)", 5100, 99],
    [
      "Total",
      "",
      "=SUM(C1:C8)",
      "=SUM(D1:D8)",
      "=SUM(E1:E8)",
      "=SUM(F1:F8)",
      "=SUM(G1:G8)",
      "=SUM(H1:H8)",
      "",
    ],
    [
      "Average",
      "",
      "=AVERAGE(C1:C8)",
      "=AVERAGE(D1:D8)",
      "=AVERAGE(E1:E8)",
      "=AVERAGE(F1:F8)",
      "=AVERAGE(G1:G8)",
      "=AVERAGE(H1:H8)",
      "",
    ],
  ],
};

/**
 * Adjusts cell references in formulas when rows are inserted.
 * insertPosition is 0-based data index. count is number of rows inserted.
 *
 * Two behaviors (mirroring Excel/Sheets):
 * 1. Range refs like B1:B5 — if inserting at or just after the range end,
 *    expand the end ref. E.g. insert at index 5 → =SUM(B1:B5) becomes =SUM(B1:B6).
 * 2. Single refs and refs past the insert point shift down.
 */
function shiftFormulaRows(
  formula: string,
  insertPosition: number,
  count: number
): string {
  if (!formula.startsWith("=")) return formula;

  // Step 1: Expand range end-refs (e.g. B1:B5 → B1:B6 when inserting at position 5)
  // A range like X<start>:X<end> where end (1-based) == insertPosition should expand.
  formula = formula.replace(
    /([A-Z]+)(\d+):([A-Z]+)(\d+)/gi,
    (match, col1, startStr, col2, endStr) => {
      const startRow = parseInt(startStr, 10);
      const endRow = parseInt(endStr, 10);
      let newEnd = endRow;
      // endRow is 1-based; insertPosition is 0-based.
      // If inserting at index 5, that's between 1-based rows 5 and 6.
      // A range ending at row 5 (index 4) should expand to row 6 (include new row).
      // Condition: endRow == insertPosition (1-based row 5 == 0-based index 5)
      // or endRow > insertPosition (refs past insert point shift down).
      if (endRow >= insertPosition) {
        newEnd = endRow + count;
      }
      let newStart = startRow;
      if (startRow > insertPosition) {
        newStart = startRow + count;
      }
      return `${col1}${newStart}:${col2}${newEnd}`;
    }
  );

  // Step 2: Shift standalone (non-range) refs past the insert point.
  // We need to avoid double-shifting refs already handled in ranges.
  // Process refs that are NOT part of a range (not preceded by : or followed by :).
  formula = formula.replace(
    /(?<!:)([A-Z]+)(\d+)(?![\d]*:)/gi,
    (match, col, rowStr) => {
      const row = parseInt(rowStr, 10);
      if (row > insertPosition) {
        return `${col}${row + count}`;
      }
      return match;
    }
  );

  return formula;
}

function shrinkFormulaRows(
  formula: string,
  deletedPositions: number[]
): string {
  if (!formula.startsWith("=")) return formula;

  // Handle ranges first
  formula = formula.replace(
    /([A-Z]+)(\d+):([A-Z]+)(\d+)/gi,
    (match, col1, startStr, col2, endStr) => {
      const startRow = parseInt(startStr, 10);
      const endRow = parseInt(endStr, 10);
      const startShift = deletedPositions.filter((d) => d < startRow - 1).length;
      const endShift = deletedPositions.filter((d) => d < endRow - 1).length;
      // Also shrink end if the deleted row was the last in the range
      const endOnDeleted = deletedPositions.includes(endRow - 1) ? 1 : 0;
      return `${col1}${startRow - startShift}:${col2}${endRow - endShift - endOnDeleted}`;
    }
  );

  // Handle standalone refs
  formula = formula.replace(
    /(?<!:)([A-Z]+)(\d+)(?![\d]*:)/gi,
    (match, col, rowStr) => {
      const row = parseInt(rowStr, 10);
      const dataIdx = row - 1;
      if (deletedPositions.includes(dataIdx)) return match;
      const shiftBy = deletedPositions.filter((d) => d < dataIdx).length;
      return shiftBy > 0 ? `${col}${row - shiftBy}` : match;
    }
  );

  return formula;
}

const tableStores: Map<string, TableState> = new Map();

export function getTableStore(threadId: string): TableState {
  if (!tableStores.has(threadId)) {
    tableStores.set(threadId, {
      colHeaders: [...DEFAULT_TABLE_STATE.colHeaders],
      data: DEFAULT_TABLE_STATE.data.map((row) => [...row]),
    });
  }
  return tableStores.get(threadId)!;
}

export function getTableData(threadId: string): {
  data: TableData;
  colHeaders: string[];
} {
  const store = getTableStore(threadId);
  return { data: store.data, colHeaders: store.colHeaders };
}

export function updateCells(
  threadId: string,
  updates: { row: number; col: number; value: CellValue }[]
): { success: boolean; message: string } {
  const store = getTableStore(threadId);

  for (const { row, col, value } of updates) {
    if (row < 0 || col < 0)
      return {
        success: false,
        message: `Invalid cell position: row ${row}, col ${col}`,
      };

    while (store.data.length <= row)
      store.data.push(new Array(store.colHeaders.length).fill(null));
    while (store.data[row].length <= col) store.data[row].push(null);

    store.data[row][col] = value;
  }

  return { success: true, message: `Updated ${updates.length} cell(s)` };
}

export function addRows(
  threadId: string,
  rows: CellValue[][],
  position?: number
): { success: boolean; message: string; newRowIndices: number[] } {
  const store = getTableStore(threadId);
  const insertPosition = position ?? store.data.length;
  const newRowIndices: number[] = [];
  const count = rows.length;

  // Shift formula references in existing rows before inserting
  for (let r = 0; r < store.data.length; r++) {
    for (let c = 0; c < store.data[r].length; c++) {
      const val = store.data[r][c];
      if (typeof val === "string" && val.startsWith("=")) {
        store.data[r][c] = shiftFormulaRows(val, insertPosition, count);
      }
    }
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    while (row.length < store.colHeaders.length) row.push(null);
    store.data.splice(insertPosition + i, 0, row);
    newRowIndices.push(insertPosition + i);
  }

  return {
    success: true,
    message: `Added ${rows.length} row(s) at position ${insertPosition}`,
    newRowIndices,
  };
}

export function deleteRows(
  threadId: string,
  rowIndices: number[]
): { success: boolean; message: string } {
  const store = getTableStore(threadId);
  const validIndices = rowIndices.filter((i) => i >= 0 && i < store.data.length);
  const sorted = [...validIndices].sort((a, b) => b - a);

  // Remove rows (from end first so indices stay valid)
  for (const idx of sorted) {
    store.data.splice(idx, 1);
  }

  // Shrink formula references in remaining rows
  for (let r = 0; r < store.data.length; r++) {
    for (let c = 0; c < store.data[r].length; c++) {
      const val = store.data[r][c];
      if (typeof val === "string" && val.startsWith("=")) {
        store.data[r][c] = shrinkFormulaRows(val, validIndices);
      }
    }
  }

  return { success: true, message: `Deleted ${validIndices.length} row(s)` };
}

export function setFormula(
  threadId: string,
  row: number,
  col: number,
  formula: string
): { success: boolean; message: string } {
  const store = getTableStore(threadId);
  const f = formula.startsWith("=") ? formula : `=${formula}`;

  if (row < 0 || row >= store.data.length)
    return { success: false, message: `Invalid row index: ${row}` };
  if (col < 0 || col >= store.colHeaders.length)
    return { success: false, message: `Invalid column index: ${col}` };

  store.data[row][col] = f;
  return {
    success: true,
    message: `Set formula "${f}" at row ${row}, col ${col}`,
  };
}

export function queryTable(
  threadId: string,
  columnIndex: number,
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "contains",
  value: string | number
): {
  success: boolean;
  matchingRows: { rowIndex: number; data: CellValue[] }[];
  message: string;
} {
  const store = getTableStore(threadId);
  const matchingRows: { rowIndex: number; data: CellValue[] }[] = [];

  for (let i = 0; i < store.data.length; i++) {
    const cellValue = store.data[i][columnIndex];
    if (typeof cellValue === "string" && cellValue.startsWith("=")) continue;

    let matches = false;
    switch (operator) {
      case "=":
        matches = cellValue === value;
        break;
      case "!=":
        matches = cellValue !== value;
        break;
      case ">":
        matches =
          typeof cellValue === "number" &&
          typeof value === "number" &&
          cellValue > value;
        break;
      case "<":
        matches =
          typeof cellValue === "number" &&
          typeof value === "number" &&
          cellValue < value;
        break;
      case ">=":
        matches =
          typeof cellValue === "number" &&
          typeof value === "number" &&
          cellValue >= value;
        break;
      case "<=":
        matches =
          typeof cellValue === "number" &&
          typeof value === "number" &&
          cellValue <= value;
        break;
      case "contains":
        matches =
          typeof cellValue === "string" &&
          typeof value === "string" &&
          cellValue.toLowerCase().includes(value.toLowerCase());
        break;
    }

    if (matches) matchingRows.push({ rowIndex: i, data: [...store.data[i]] });
  }

  return {
    success: true,
    matchingRows,
    message: `Found ${matchingRows.length} matching row(s)`,
  };
}

const COL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function colLetter(idx: number): string {
  if (idx < 26) return COL_LETTERS[idx];
  return COL_LETTERS[Math.floor(idx / 26) - 1] + COL_LETTERS[idx % 26];
}

/**
 * Finds aggregate rows (Total, Average, Sum, Count, etc.) and rewrites their
 * formulas so the ranges cover all data rows above them.
 */
export function recalculateAggregates(
  threadId: string
): { success: boolean; message: string; updatedRows: number[] } {
  const store = getTableStore(threadId);
  const aggregateLabels: Record<string, string> = {
    total: "SUM",
    sum: "SUM",
    average: "AVERAGE",
    avg: "AVERAGE",
    mean: "AVERAGE",
    count: "COUNT",
    max: "MAX",
    min: "MIN",
  };

  const updatedRows: number[] = [];

  for (let r = 0; r < store.data.length; r++) {
    const firstCell = store.data[r][0];
    if (typeof firstCell !== "string") continue;
    const label = firstCell.trim().toLowerCase();
    const func = aggregateLabels[label];
    if (!func) continue;

    // This is an aggregate row. Find the contiguous data rows above it.
    // Data rows start at row 0 and go up to (r - 1), skipping any other aggregate rows above.
    let dataStart = -1;
    let dataEnd = -1;
    for (let dr = 0; dr < r; dr++) {
      const drFirst = store.data[dr][0];
      const drLabel = typeof drFirst === "string" ? drFirst.trim().toLowerCase() : "";
      if (aggregateLabels[drLabel]) continue; // skip other aggregate rows
      if (dataStart === -1) dataStart = dr;
      dataEnd = dr;
    }

    if (dataStart === -1) continue; // no data rows found

    const startRow1 = dataStart + 1; // 1-based
    const endRow1 = dataEnd + 1;

    // Rewrite formulas for columns 1+ (skip column 0 which is the label)
    for (let c = 1; c < store.data[r].length; c++) {
      const cl = colLetter(c);
      store.data[r][c] = `=${func}(${cl}${startRow1}:${cl}${endRow1})`;
    }
    updatedRows.push(r);
  }

  return {
    success: true,
    message: updatedRows.length > 0
      ? `Recalculated ${updatedRows.length} aggregate row(s)`
      : "No aggregate rows found to recalculate",
    updatedRows,
  };
}

export function addColumn(
  threadId: string,
  headerName: string,
  position?: number
): { success: boolean; message: string } {
  const store = getTableStore(threadId);
  const insertPosition = position ?? store.colHeaders.length;

  store.colHeaders.splice(insertPosition, 0, headerName);
  for (const row of store.data) row.splice(insertPosition, 0, null);

  return {
    success: true,
    message: `Added column "${headerName}" at position ${insertPosition}`,
  };
}
