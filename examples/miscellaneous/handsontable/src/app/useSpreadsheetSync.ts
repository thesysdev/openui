"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { useTableContext } from "./TableContext";

type CellValue = string | number | null;

/**
 * False inside chat messages restored from storage. Their SpreadsheetTable
 * snapshots were applied when the reply first arrived; applying them again on
 * a reload or when the chat reopens would overwrite newer edits to the sheet.
 */
export const SpreadsheetSyncContext = createContext(true);

export function useSpreadsheetSync(
  data: CellValue[][] | undefined,
  colHeaders: string[] | undefined
) {
  const { syncTableData } = useTableContext();
  const enabled = useContext(SpreadsheetSyncContext);
  const lastDataRef = useRef<string>("");

  useEffect(() => {
    if (!enabled || !data) return;
    const dataStr = JSON.stringify({ data, colHeaders });
    if (dataStr !== lastDataRef.current) {
      lastDataRef.current = dataStr;
      syncTableData(data, colHeaders);
    }
  }, [enabled, data, colHeaders, syncTableData]);
}
