"use client";

import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";
import { useEffect, useRef, useCallback, useState } from "react";
import type { CellChange, ChangeSource } from "handsontable/common";
import { useTableContext } from "./TableContext";

type CellValue = string | number | null;

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

const DEFAULT_DATA: CellValue[][] = Array.from({ length: 10 }, () =>
  Array(6).fill(null)
);

/* eslint-disable @typescript-eslint/no-explicit-any */
let HotTable: any = null;
let HyperFormula: any = null;
let modulesLoaded = false;

export default function PersistentSpreadsheet() {
  const { tableData, syncTableData } = useTableContext();
  const hotRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [containerHeight, setContainerHeight] = useState(400);

  const lastContextDataRef = useRef<string>("");
  const isSyncingRef = useRef(false);
  const colHeadersRef = useRef<string[] | undefined>(tableData?.colHeaders);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height > 0 ? rect.height : 400);
      }
      // Tell Handsontable to re-render with new dimensions
      const hot = hotRef.current?.hotInstance;
      if (hot) {
        hot.refreshDimensions();
        hot.render();
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    const t = setTimeout(updateSize, 100);
    return () => {
      window.removeEventListener("resize", updateSize);
      clearTimeout(t);
    };
  }, [isClient]);

  useEffect(() => {
    const load = async () => {
      if (typeof window !== "undefined" && !modulesLoaded) {
        const [hotModule, hfModule, registryModule] = await Promise.all([
          import("@handsontable/react-wrapper"),
          import("hyperformula"),
          import("handsontable/registry"),
        ]);
        HotTable = hotModule.HotTable;
        HyperFormula = hfModule.HyperFormula;
        registryModule.registerAllModules();
        modulesLoaded = true;
        setIsClient(true);
      } else if (modulesLoaded) {
        setIsClient(true);
      }
    };
    load();
  }, []);

  const saveData = useCallback(
    async (data: CellValue[][], colHeaders?: string[]) => {
      if (isSyncingRef.current) return;
      try {
        isSyncingRef.current = true;
        await syncTableData(data, colHeaders || colHeadersRef.current);
      } catch (e) {
        console.error("Failed to save table data:", e);
      } finally {
        isSyncingRef.current = false;
      }
    },
    [syncTableData]
  );

  useEffect(() => {
    const hot = hotRef.current?.hotInstance;
    if (!hot || isInitialized) return;

    const data = tableData?.data || DEFAULT_DATA;
    const colHeaders = tableData?.colHeaders;

    hot.loadData(deepClone(data));
    if (colHeaders) {
      hot.updateSettings({ colHeaders });
      colHeadersRef.current = colHeaders;
    }

    lastContextDataRef.current = JSON.stringify(tableData);
    setIsInitialized(true);
  }, [isClient, tableData, isInitialized]);

  useEffect(() => {
    const hot = hotRef.current?.hotInstance;
    if (!hot || !isInitialized || isSyncingRef.current) return;

    const str = JSON.stringify(tableData);
    if (str !== lastContextDataRef.current && tableData?.data) {
      lastContextDataRef.current = str;
      hot.loadData(deepClone(tableData.data));
      if (tableData.colHeaders) {
        hot.updateSettings({ colHeaders: tableData.colHeaders });
        colHeadersRef.current = tableData.colHeaders;
      }
    }
  }, [tableData, isInitialized]);

  const handleAfterChange = useCallback(
    (changes: CellChange[] | null, source: ChangeSource) => {
      if (source === "loadData" || !changes) return;
      const hot = hotRef.current?.hotInstance;
      if (hot) saveData(hot.getData() as CellValue[][]);
    },
    [saveData]
  );

  const handleStructuralChange = useCallback(() => {
    const hot = hotRef.current?.hotInstance;
    if (hot) saveData(hot.getData() as CellValue[][]);
  }, [saveData]);

  const handleExportCSV = useCallback(() => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;
    const exportPlugin = hot.getPlugin("exportFile");
    exportPlugin?.downloadFile("csv", {
      bom: false,
      columnDelimiter: ",",
      columnHeaders: true,
      exportHiddenColumns: true,
      exportHiddenRows: true,
      fileExtension: "csv",
      filename: "Spreadsheet_[YYYY]-[MM]-[DD]",
      mimeType: "text/csv",
      rowDelimiter: "\r\n",
      rowHeaders: false,
    });
  }, []);

  if (!isClient || !HotTable || !HyperFormula) {
    return (
      <div className="persistent-spreadsheet">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 text-sm">Loading spreadsheet...</div>
        </div>
      </div>
    );
  }

  const HotTableComponent = HotTable;
  const HyperFormulaEngine = HyperFormula;
  const currentData = tableData?.data || DEFAULT_DATA;
  const currentHeaders = tableData?.colHeaders;

  return (
    <div className="persistent-spreadsheet">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div>
          <h2 className="text-sm font-semibold text-white">Spreadsheet</h2>
          <p className="text-xs text-gray-500">
            {currentData.length} rows ×{" "}
            {currentHeaders?.length || currentData[0]?.length || 0} columns
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-md transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div ref={containerRef} className="flex-1 min-h-0 relative">
        <HotTableComponent
          ref={hotRef}
          data={deepClone(currentData)}
          colHeaders={currentHeaders || true}
          rowHeaders={true}
          height={containerHeight}
          width="auto"
          licenseKey="non-commercial-and-evaluation"
          contextMenu={true}
          manualColumnResize={true}
          manualRowResize={true}
          autoWrapRow={true}
          autoWrapCol={true}
          minSpareRows={50}
          cells={(_row: number, col: number) => {
            if (col >= 2) return { numericFormat: { pattern: "0,0.##" } };
            return {};
          }}
          formulas={{ engine: HyperFormulaEngine }}
          afterChange={handleAfterChange}
          afterCreateRow={handleStructuralChange}
          afterRemoveRow={handleStructuralChange}
          afterCreateCol={handleStructuralChange}
          afterRemoveCol={handleStructuralChange}
          className="htDark"
          stretchH="all"
        />
      </div>

      <div className="px-4 py-1.5 border-t border-white/10">
        <p className="text-xs text-gray-600">
          Right-click for options • Formulas supported (=SUM, =AVERAGE, etc.)
        </p>
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
