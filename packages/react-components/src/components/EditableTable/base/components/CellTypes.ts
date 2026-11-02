import type { Table } from "@tanstack/react-table";

export type EditableCellType = "text" | "number" | "date-single" | "select" | "url";

export interface EditableTableMeta {
  updateData: (rowIndex: number, columnId: string, value: unknown) => void;
}

export interface EditableColumnMeta {
  type?: EditableCellType;
  options?: Array<{ value: string; label: string }>;
}

export type EditableCellNavigateDirection = "up" | "down" | "left" | "right";

export interface CellRendererProps {
  value: any;
  rowIndex: number;
  columnId: string;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (rowIndex: number, columnId: string) => void;
  onStartEdit: (rowIndex: number, columnId: string) => void;
  onFinishEdit: (save: boolean) => void;
  onNavigate: (direction: EditableCellNavigateDirection) => void;
  table: Table<any>;
}
