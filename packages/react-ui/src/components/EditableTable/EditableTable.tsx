import {
  Column,
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  Row,
  Table,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Link,
  List,
  RotateCcw,
  Type,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { getCellRenderer } from "./base/components/cellRegistry";
import type {
  EditableCellNavigateDirection,
  EditableCellType,
  EditableColumnMeta,
  EditableTableMeta,
} from "./base/components/CellTypes";

export type { EditableCellType } from "./base/components/CellTypes";

export interface EditableTableRow {
  id: string;
  [key: string]: any;
}

export interface EditableTableColumn {
  key: string;
  header: string;
  type?: EditableCellType;
  width?: number;
  /** Options for `select` type cells */
  options?: Array<{ value: string; label: string }>;
}

export interface EditableTableProps {
  data: EditableTableRow[];
  columns: EditableTableColumn[];
  onDataChange?: (data: EditableTableRow[]) => void;
  className?: string;
}

interface CellPosition {
  row: number;
  column: string;
}

interface CellRendererProps {
  row: Row<EditableTableRow>;
  column: Column<EditableTableRow>;
  columns: EditableTableColumn[];
  selectedPosition: CellPosition | null;
  editingPosition: CellPosition | null;
  handleCellSelect: (rowIndex: number, columnId: string) => void;
  handleStartEdit: (rowIndex: number, columnId: string) => void;
  handleFinishEdit: (save: boolean) => void;
  handleNavigate: (direction: EditableCellNavigateDirection) => void;
  table: Table<EditableTableRow>;
  getValue: () => any;
}

const CellRenderer = (info: CellRendererProps) => {
  const colKey = info.column.id;
  const colConfig = info.columns.find((c) => c.key === colKey);
  const type = (colConfig?.type || "text") as EditableCellType;
  const CellCmp = getCellRenderer(type);
  const rowIndex = info.row.index;
  const columnId = colKey;
  const isSelected =
    info.selectedPosition?.row === rowIndex && info.selectedPosition?.column === columnId;
  const isEditing =
    info.editingPosition?.row === rowIndex && info.editingPosition?.column === columnId;

  return (
    <CellCmp
      value={info.getValue()}
      rowIndex={rowIndex}
      columnId={columnId}
      isSelected={isSelected}
      isEditing={isEditing}
      onSelect={info.handleCellSelect}
      onStartEdit={info.handleStartEdit}
      onFinishEdit={info.handleFinishEdit}
      onNavigate={info.handleNavigate}
      table={info.table}
    />
  );
};

const headerIcon = (type: EditableCellType) => {
  switch (type) {
    case "url":
      return <Link size={16} />;
    case "date-single":
      return <CalendarDays size={16} />;
    case "select":
      return <List size={16} />;
    case "text":
    case "number":
    default:
      return <Type size={16} />;
  }
};

const PORTAL_CELL_TYPES: EditableCellType[] = ["date-single", "select"];

/**
 * Spreadsheet-like editable grid built on @tanstack/react-table. Cells are
 * selected with a click / keyboard and edited inline according to the column
 * `type` (text, number, url, date-single, select).
 */
export const EditableTable = React.forwardRef<HTMLDivElement, EditableTableProps>(
  ({ data, columns, onDataChange, className }, ref) => {
    const [selectedPosition, setSelectedPosition] = useState<CellPosition | null>(null);
    const [editingPosition, setEditingPosition] = useState<
      (CellPosition & { cellType: EditableCellType }) | null
    >(null);
    const tableRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    /**
     * Horizontal scroll controls state
     * - isScrollable: whether content overflows horizontally
     * - canScrollLeft/canScrollRight: whether there is hidden content in that direction
     * - columnLefts: cumulative left offsets of header cells relative to the scroll container
     *   Used to snap scrolling by exactly one column at a time.
     */
    const [isScrollable, setIsScrollable] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [columnLefts, setColumnLefts] = useState<number[]>([]);

    React.useImperativeHandle(ref, () => tableRef.current as HTMLDivElement);

    const updateData = useCallback(
      (rowIndex: number, columnId: string, value: unknown) => {
        const oldRow = data[rowIndex];
        if (!oldRow) return;
        const newData = [...data];
        newData[rowIndex] = { ...oldRow, [columnId]: value };
        onDataChange?.(newData);
      },
      [data, onDataChange],
    );

    const handleCellSelect = useCallback((rowIndex: number, columnId: string) => {
      setSelectedPosition({ row: rowIndex, column: columnId });
      setEditingPosition(null);
    }, []);

    const handleStartEdit = useCallback(
      (rowIndex: number, columnId: string) => {
        const cellType = columns.find((col) => col.key === columnId)?.type ?? "text";

        setSelectedPosition({ row: rowIndex, column: columnId });
        setEditingPosition({ row: rowIndex, column: columnId, cellType });
      },
      [columns],
    );

    const handleFinishEdit = useCallback((_save: boolean) => {
      // Keep the cell selected after editing
      setEditingPosition(null);
    }, []);

    const handleNavigate = useCallback(
      (direction: EditableCellNavigateDirection) => {
        if (!selectedPosition) return;

        const { row, column } = selectedPosition;
        const columnIndex = columns.findIndex((col) => col.key === column);

        let newRow = row;
        let newColumnIndex = columnIndex;

        switch (direction) {
          case "up":
            newRow = Math.max(0, row - 1);
            break;
          case "down":
            newRow = Math.min(data.length - 1, row + 1);
            break;
          case "left":
            newColumnIndex = Math.max(0, columnIndex - 1);
            break;
          case "right":
            newColumnIndex = Math.min(columns.length - 1, columnIndex + 1);
            break;
        }

        const newColumn = columns[newColumnIndex]?.key || column;
        setSelectedPosition({ row: newRow, column: newColumn });
        setEditingPosition(null);
      },
      [selectedPosition, columns, data.length],
    );

    // Handle table-level keyboard events
    useEffect(() => {
      const handleTableKeyDown = (e: KeyboardEvent) => {
        // Only handle if no cell is focused and we're not editing
        if (!editingPosition && document.activeElement === tableRef.current) {
          if (e.key === "Tab") {
            e.preventDefault();
            // Focus first cell if nothing is selected
            if (!selectedPosition && data.length > 0 && columns.length > 0) {
              const firstColumn = columns[0];
              if (firstColumn) {
                setSelectedPosition({ row: 0, column: firstColumn.key });
              }
            }
          }
        }
      };

      const tableElement = tableRef.current;
      if (tableElement) {
        tableElement.addEventListener("keydown", handleTableKeyDown);
        return () => {
          tableElement.removeEventListener("keydown", handleTableKeyDown);
        };
      }

      return undefined;
    }, [editingPosition, selectedPosition, data.length, columns]);

    // Handle click outside table to deselect
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const isPortalCellEditing =
          editingPosition?.cellType && PORTAL_CELL_TYPES.includes(editingPosition.cellType);

        if (
          tableRef.current &&
          !tableRef.current.contains(event.target as Node) &&
          !isPortalCellEditing
        ) {
          // Clear selections - the blur event will handle saving any active edits
          setSelectedPosition(null);
          setEditingPosition(null);
        }
      };
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }, [editingPosition?.cellType]);

    const columnHelper = createColumnHelper<EditableTableRow>();

    const tableColumns: ColumnDef<EditableTableRow>[] = columns.map((col) =>
      columnHelper.accessor(col.key, {
        header: col.header,
        minSize: 0,
        size: col.width || 120,
        meta: (col.options
          ? { options: col.options, type: col.type }
          : { type: col.type }) satisfies EditableColumnMeta,
      }),
    );

    const table = useReactTable({
      data,
      columns: tableColumns,
      getCoreRowModel: getCoreRowModel(),
      meta: { updateData } satisfies EditableTableMeta,
    });

    const headerIconForColumn = useCallback((column: Column<EditableTableRow>) => {
      const type = (column.columnDef.meta as EditableColumnMeta | undefined)?.type;
      return type ? headerIcon(type) : null;
    }, []);

    /**
     * Measure scrollability and header column positions.
     * - Recomputes on container resize via ResizeObserver
     * - Updates button enabled/disabled state on scroll
     * - Computes `columnLefts` by reading each <th> left position relative to the scroll container
     */
    useEffect(() => {
      const container = scrollContainerRef.current;
      const wrapper = tableRef.current;
      if (!container || !wrapper) return;

      const updateScrollButtons = () => {
        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
      };

      const compute = () => {
        setIsScrollable(container.scrollWidth > container.clientWidth);
        updateScrollButtons();

        // Measure header cell left positions relative to the scroll container
        const ths = wrapper.querySelectorAll<HTMLTableCellElement>("thead th");
        if (!ths || ths.length === 0) {
          setColumnLefts([]);
          return;
        }
        const containerRect = container.getBoundingClientRect();
        const lefts: number[] = [];
        ths.forEach((th) => {
          const rect = th.getBoundingClientRect();
          const left = rect.left - containerRect.left + container.scrollLeft;
          lefts.push(Math.max(0, Math.round(left)));
        });
        // Ensure unique and sorted
        setColumnLefts(Array.from(new Set(lefts)).sort((a, b) => a - b));
      };

      compute();

      const ro = new ResizeObserver(() => compute());
      ro.observe(container);
      container.addEventListener("scroll", updateScrollButtons);

      return () => {
        ro.disconnect();
        container.removeEventListener("scroll", updateScrollButtons);
      };
    }, [columns, data]);

    /**
     * Scroll right to the start of the next column that is not fully visible.
     * If no next column is found, scrolls to the maximum possible scroll position.
     */
    const scrollToNextColumn = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container || columnLefts.length === 0) return;
      const current = container.scrollLeft;
      const target = columnLefts.find((l) => l > current + 1);
      const maxScroll = container.scrollWidth - container.clientWidth;
      const next = typeof target === "number" ? target : maxScroll;
      container.scrollTo({ left: Math.min(next, maxScroll), behavior: "smooth" });
    }, [columnLefts]);

    /**
     * Scroll left to the start of the previous column.
     * Picks the nearest stored left offset smaller than current scrollLeft.
     */
    const scrollToPrevColumn = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container || columnLefts.length === 0) return;
      const current = container.scrollLeft;
      const prevs = columnLefts.filter((l) => l < current - 1);
      const prev = prevs.at(-1) ?? 0;
      container.scrollTo({ left: Math.max(0, prev), behavior: "smooth" });
    }, [columnLefts]);

    return (
      <div className={clsx("openui-editable-table-wrapper", className)} ref={tableRef} tabIndex={0}>
        {isScrollable && (
          <>
            <div
              className={clsx(
                "openui-editable-table-scroll-control",
                "openui-editable-table-scroll-control--left",
                !canScrollLeft && "openui-editable-table-scroll-control--disabled",
              )}
            >
              <IconButton
                aria-label="Scroll left"
                size="small"
                variant="secondary"
                onClick={scrollToPrevColumn}
                disabled={!canScrollLeft}
                icon={<ChevronLeft size={16} />}
              />
            </div>
            <div
              className={clsx(
                "openui-editable-table-scroll-control",
                "openui-editable-table-scroll-control--right",
                !canScrollRight && "openui-editable-table-scroll-control--disabled",
              )}
            >
              <IconButton
                aria-label="Scroll right"
                size="small"
                variant="secondary"
                onClick={scrollToNextColumn}
                disabled={!canScrollRight}
                icon={<ChevronRight size={16} />}
              />
            </div>
          </>
        )}
        <div className="openui-editable-table-scroll-container" ref={scrollContainerRef}>
          <table
            className="openui-editable-table-table"
            style={{ width: isScrollable ? "max-content" : "100%" }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} style={{ width: header.getSize() }}>
                      <div className="openui-editable-table-header-container">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        <div className="openui-editable-table-header-icon">
                          {headerIconForColumn(header.column)}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(CellRenderer, {
                        ...cell.getContext(),
                        columns,
                        selectedPosition,
                        editingPosition,
                        handleCellSelect,
                        handleStartEdit,
                        handleFinishEdit,
                        handleNavigate,
                      })}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);

EditableTable.displayName = "EditableTable";

export interface EditableTableChangesBarProps {
  /** Number of cells changed since the last save/reset */
  changedCellCount: number;
  onReset?: () => void;
  onSave?: () => void;
  resetLabel?: string;
  saveLabel?: string;
  className?: string;
}

/**
 * Pending-changes summary bar shown beneath an EditableTable, with reset / save actions.
 * Renders nothing when `changedCellCount` is 0.
 */
export const EditableTableChangesBar = ({
  changedCellCount,
  onReset,
  onSave,
  resetLabel = "Reset",
  saveLabel = "Save Changes",
  className,
}: EditableTableChangesBarProps) => {
  if (changedCellCount <= 0) return null;
  return (
    <div className={clsx("openui-editable-table-changes-container", className)}>
      <div className="openui-editable-table-changes-count">{changedCellCount} changes made</div>
      <div className="openui-editable-table-changes-buttons">
        <Button
          onClick={onReset}
          variant="secondary"
          size="small"
          iconLeft={<RotateCcw size={16} />}
        >
          {resetLabel}
        </Button>
        <Button onClick={onSave} variant="primary" size="small" iconLeft={<Check size={16} />}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
};
