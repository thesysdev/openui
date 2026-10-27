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
import { z } from "zod/v4";
import {
  EditableTableChangesBar,
  EditableTable as OpenUIEditableTable,
  type EditableCellType,
  type EditableTableColumn,
  type EditableTableRow,
} from "../../components/EditableTable";
import { renderIconSlot } from "../iconSlot";
import {
  EditableColSchema,
  createEditableTableSchema,
  type EditableColProps,
  type EditableTableData,
} from "./schema";

export * from "./schema";

export const EditableCol = defineComponent({
  name: "EditableCol",
  props: EditableColSchema,
  description: `One EditableTable column: EditableCol(key, label, type?, options?, icon?, width?). type is the cell editor: "text" (default), "number", "date", "select" (pass options as SelectItems) or "url". icon is an optional leading header Icon; each type has its own default.`,
  component: () => null,
});

const EditableTableSchema = createEditableTableSchema(EditableCol);
type EditableTableProps = z.infer<typeof EditableTableSchema>;

const CELL_TYPE: Record<EditableColProps["type"], EditableCellType> = {
  text: "text",
  number: "number",
  date: "date-single",
  select: "select",
  url: "url",
};

type ColNode = { props?: Partial<EditableColProps> & { options?: unknown[]; icon?: unknown } };
type SelectItemNode = { props?: { value?: string; label?: string } };

function toColumn(node: ColNode): EditableTableColumn | null {
  const p = node?.props;
  if (!p?.key) return null;
  const options = (p.options as SelectItemNode[] | undefined)
    ?.map((o) => o?.props)
    .filter((o): o is { value: string; label?: string } => !!o?.value)
    .map((o) => ({ value: o.value, label: o.label || o.value }));
  return {
    key: p.key,
    header: p.label ?? "",
    type: CELL_TYPE[p.type ?? "text"] ?? "text",
    icon: p.icon ? renderIconSlot(p.icon) : undefined,
    width: p.width,
    options,
  };
}

function EditableTableRenderer({ props }: ComponentRenderProps<EditableTableProps>) {
  const triggerAction = useTriggerAction();
  const setFieldValue = useSetFieldValue();
  const getFieldValue = useGetFieldValue();
  const isStreaming = useIsStreaming();

  const tableName = props.name;
  const columns = useMemo(
    () =>
      (props.columns as ColNode[])
        .map(toColumn)
        .filter((c): c is EditableTableColumn => c !== null),
    [props.columns],
  );
  // Rows are bare value arrays; their index is the row id.
  const initialData = useMemo<EditableTableData>(
    () => props.rows.map((values, i) => ({ id: String(i), values })),
    [props.rows],
  );

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
  description: `Spreadsheet-like table the user edits inline: EditableTable(name, columns, rows), e.g. EditableTable("tasks", [EditableCol("task", "Task"), EditableCol("status", "Status", "select", [SelectItem("todo", "Todo"), SelectItem("done", "Done")]), EditableCol("due", "Due", "date")], [["Design review", "todo", "2026-10-12"]]). Each row is an array of values in column order (dates as ISO strings, selects as the SelectItem value). Edits are submitted as a form field named after the table when the user clicks Save Changes. It draws its own frame, so never wrap it in a Card; place it directly in a Section or TabItem.`,
  component: EditableTableRenderer,
});
