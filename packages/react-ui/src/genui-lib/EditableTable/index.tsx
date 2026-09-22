"use client";

import {
  defineComponent,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
  useTriggerAction,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EditableTableChangesBar,
  EditableTable as OpenUIEditableTable,
  type EditableTableRow,
} from "../../components/EditableTable";
import { EditableTableSchema, type EditableTableData, type EditableTableProps } from "./schema";

export * from "./schema";

function EditableTableRenderer({ props }: ComponentRenderProps<EditableTableProps>) {
  const triggerAction = useTriggerAction();
  const setFieldValue = useSetFieldValue();
  const getFieldValue = useGetFieldValue();
  const isStreaming = useIsStreaming();

  const tableName = props.name;
  const columns = props.columns;
  const initialData = props.data;

  const columnKeys = useMemo(() => columns.map((c) => c.key), [columns]);

  // Positional `values` (LLM-friendly) → keyed row objects for the grid
  const toRows = useCallback(
    (data: EditableTableData): EditableTableRow[] =>
      data.map((row) => {
        const valuesMap = columnKeys.reduce((acc: Record<string, any>, key, index) => {
          acc[key] = row.values[index];
          return acc;
        }, {});
        return { ...valuesMap, id: row.id };
      }),
    [columnKeys],
  );

  const fromRows = useCallback(
    (rows: EditableTableRow[]): EditableTableData =>
      rows.map((row) => ({ id: row.id, values: columnKeys.map((key) => row[key]) })),
    [columnKeys],
  );

  const existingValue = getFieldValue(tableName, tableName);

  const baselineDataMapRef = useRef<Map<string, EditableTableRow> | undefined>(undefined);
  const [tableData, setTableData] = useState<EditableTableRow[]>(() =>
    toRows(existingValue || initialData),
  );
  const [changedCellCount, setChangedCellCount] = useState(0);

  useEffect(() => {
    setTableData(toRows(existingValue || initialData));
  }, [existingValue, initialData, toRows]);

  // Establish baseline once streaming ends so we can count changed cells
  useEffect(() => {
    if (!isStreaming && baselineDataMapRef.current === undefined) {
      baselineDataMapRef.current = new Map(
        toRows(existingValue || initialData).map((row) => [row.id, row]),
      );
    }
  }, [isStreaming, existingValue, initialData, toRows]);

  const calculateChangedCellCount = useCallback(
    (changedData: EditableTableRow[], baseline: Map<string, EditableTableRow> | undefined) => {
      if (!baseline) {
        setChangedCellCount(0);
        return;
      }
      let count = 0;
      const changedMap = new Map(changedData.map(({ id, ...values }) => [id, values]));
      baseline.forEach((baseValues, id) => {
        const changedValues = changedMap.get(id);
        if (!changedValues) return;
        for (const key of columnKeys) {
          if (changedValues[key] !== baseValues[key]) count++;
        }
      });
      setChangedCellCount(count);
    },
    [columnKeys],
  );

  const handleDataChange = useCallback(
    (changedData: EditableTableRow[]) => {
      calculateChangedCellCount(changedData, baselineDataMapRef.current);
      setTableData(changedData);
    },
    [calculateChangedCellCount],
  );

  const handleReset = useCallback(() => {
    setChangedCellCount(0);
    if (baselineDataMapRef.current) {
      setTableData(Array.from(baselineDataMapRef.current.values()));
    }
  }, []);

  const handleSubmit = useCallback(() => {
    setFieldValue(tableName, "EditableTable", tableName, fromRows(tableData));
    triggerAction("Save Changes", tableName);
    setChangedCellCount(0);
    baselineDataMapRef.current = new Map(tableData.map((row) => [row.id, row]));
  }, [tableName, tableData, fromRows, setFieldValue, triggerAction]);

  return (
    <>
      <OpenUIEditableTable data={tableData} columns={columns} onDataChange={handleDataChange} />
      <EditableTableChangesBar
        changedCellCount={changedCellCount}
        onReset={handleReset}
        onSave={handleSubmit}
      />
    </>
  );
}

export const EditableTable = defineComponent({
  name: "EditableTable",
  props: EditableTableSchema,
  description:
    "Spreadsheet-like table whose cells the user can edit inline (text, number, url, date, select columns); edits are saved back as a form field",
  component: EditableTableRenderer,
});
