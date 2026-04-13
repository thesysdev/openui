"use client";

import { useEffect, useRef } from "react";
import { useTableContext } from "./TableContext";

type CellValue = string | number | null;

export function useSpreadsheetSync(
  data: CellValue[][] | undefined,
  colHeaders: string[] | undefined
) {
  const { syncTableData } = useTableContext();
  const lastDataRef = useRef<string>("");

  useEffect(() => {
    if (!data) return;
    const dataStr = JSON.stringify({ data, colHeaders });
    if (dataStr !== lastDataRef.current) {
      lastDataRef.current = dataStr;
      syncTableData(data, colHeaders);
    }
  }, [data, colHeaders, syncTableData]);
}
