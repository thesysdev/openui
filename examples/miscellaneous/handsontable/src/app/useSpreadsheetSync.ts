"use client";

import { useEffect } from "react";
import { useTableContext } from "./TableContext";

type CellValue = string | number | null;

// Tool results on the server are authoritative; generated UI must never write
// a stale or partially streamed copy back over the spreadsheet.
export function useSpreadsheetSync(
  data: CellValue[][] | undefined,
  colHeaders: string[] | undefined,
) {
  const { refreshTableData } = useTableContext();
  useEffect(() => {
    if (data && colHeaders) void refreshTableData().catch(console.error);
  }, [data, colHeaders, refreshTableData]);
}
