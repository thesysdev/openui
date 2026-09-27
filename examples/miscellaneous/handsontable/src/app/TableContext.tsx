"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type CellValue = string | number | null;

interface TableData {
  data: CellValue[][];
  colHeaders?: string[];
}

interface TableContextType {
  threadId: string;
  refreshTableData: () => Promise<void>;
  tableData: TableData | null;
  syncTableData: (data: CellValue[][], colHeaders?: string[]) => Promise<void>;
}

const TableContext = createContext<TableContextType | null>(null);

export function TableProvider({ children }: { children: ReactNode }) {
  const [threadId, setThreadId] = useState("");
  const [tableData, setTableDataState] = useState<TableData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingSave = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let id = localStorage.getItem("openui-spreadsheet-id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("openui-spreadsheet-id", id);
    }
    setThreadId(id);
  }, []);

  const refreshTableData = useCallback(async () => {
    if (!threadId) return;
    await pendingSave.current;
    const response = await fetch(`/api/table?threadId=${encodeURIComponent(threadId)}`);
    if (!response.ok) throw new Error("Failed to load spreadsheet");
    setTableDataState(await response.json());
  }, [threadId]);

  useEffect(() => {
    void refreshTableData().catch((error: Error) => setError(error.message));
  }, [refreshTableData]);

  const syncTableData = useCallback(
    (data: CellValue[][], colHeaders?: string[]) => {
      const snapshot = JSON.parse(JSON.stringify({ data, colHeaders })) as TableData;
      setTableDataState(snapshot);
      const save = pendingSave.current.then(async () => {
        const response = await fetch("/api/table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId, ...snapshot }),
        });
        if (!response.ok) throw new Error("Failed to save spreadsheet");
      });
      pendingSave.current = save.catch((error: Error) => setError(error.message));
      return save;
    },
    [threadId],
  );

  if (error) return <p role="alert">{error}</p>;
  if (!tableData || !threadId) return <p>Loading spreadsheet…</p>;

  return (
    <TableContext.Provider value={{ threadId, refreshTableData, tableData, syncTableData }}>
      {children}
    </TableContext.Provider>
  );
}

export function useTableContext() {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error("useTableContext must be used within TableProvider");
  return ctx;
}
