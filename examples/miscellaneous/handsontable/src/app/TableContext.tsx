"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type CellValue = string | number | null;

interface TableData {
  data: CellValue[][];
  colHeaders?: string[];
}

interface TableContextType {
  /** This browser's table on the server. Null until it has been read from localStorage. */
  tableId: string | null;
  tableData: TableData | null;
  syncTableData: (data: CellValue[][], colHeaders?: string[]) => Promise<void>;
}

const INITIAL_TABLE: TableData = {
  colHeaders: ["Product", "Category", "Q1 Revenue", "Q2 Revenue", "Q3 Revenue", "Q4 Revenue", "Annual Revenue", "Units Sold", "Unit Price"],
  data: [
    ["MacBook Pro 16\"", "Laptops", 48500, 52300, 61200, 74800, "=SUM(C1:F1)", 320, 2499],
    ["iPhone 15 Pro", "Phones", 125000, 98700, 112400, 185600, "=SUM(C2:F2)", 4200, 999],
    ["AirPods Pro", "Audio", 32400, 28900, 35100, 52800, "=SUM(C3:F3)", 8800, 249],
    ["iPad Air", "Tablets", 21800, 24500, 19600, 38200, "=SUM(C4:F4)", 1560, 599],
    ["Apple Watch Ultra", "Wearables", 18200, 21400, 25800, 31600, "=SUM(C5:F5)", 980, 799],
    ["Mac Mini", "Desktops", 15600, 17200, 14800, 22400, "=SUM(C6:F6)", 620, 599],
    ["HomePod Mini", "Audio", 8400, 7200, 9600, 18500, "=SUM(C7:F7)", 3700, 99],
    ["AirTag 4-Pack", "Accessories", 6200, 5800, 7400, 14200, "=SUM(C8:F8)", 5100, 99],
    ["Total", "", "=SUM(C1:C8)", "=SUM(D1:D8)", "=SUM(E1:E8)", "=SUM(F1:F8)", "=SUM(G1:G8)", "=SUM(H1:H8)", ""],
    ["Average", "", "=AVERAGE(C1:C8)", "=AVERAGE(D1:D8)", "=AVERAGE(E1:E8)", "=AVERAGE(F1:F8)", "=AVERAGE(G1:G8)", "=AVERAGE(H1:H8)", ""],
  ],
};

const TableContext = createContext<TableContextType | null>(null);

const TABLE_ID_KEY = "openui-handsontable:table-id";

// Each browser gets its own table on the server, so visitors don't overwrite each other.
function readTableId(): string {
  try {
    const saved = localStorage.getItem(TABLE_ID_KEY);
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(TABLE_ID_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function TableProvider({ children }: { children: ReactNode }) {
  const [tableId, setTableId] = useState<string | null>(null);
  const [tableData, setTableDataState] = useState<TableData | null>(INITIAL_TABLE);

  // Load this browser's table from the server instead of uploading the starting copy over it.
  useEffect(() => {
    const id = readTableId();
    setTableId(id);
    fetch(`/api/table?threadId=${encodeURIComponent(id)}`)
      .then((res) => (res.ok ? (res.json() as Promise<TableData>) : null))
      .then((saved) => {
        if (saved?.data) setTableDataState(saved);
      })
      .catch((error) => console.error("Failed to load table data:", error));
  }, []);

  const syncTableData = useCallback(
    async (data: CellValue[][], colHeaders?: string[]) => {
      setTableDataState({ data, colHeaders });
      if (!tableId) return;

      try {
        await fetch("/api/table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: tableId, data, colHeaders }),
        });
      } catch (error) {
        console.error("Failed to sync table data:", error);
      }
    },
    [tableId],
  );

  return (
    <TableContext.Provider value={{ tableId, tableData, syncTableData }}>
      {children}
    </TableContext.Provider>
  );
}

export function useTableContext() {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error("useTableContext must be used within TableProvider");
  return ctx;
}
