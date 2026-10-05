import type React from "react";
import type { CellRendererProps, EditableCellType } from "./CellTypes";
import { EditableDateCell } from "./EditableDateCell";
import { EditableNumberCell } from "./EditableNumberCell";
import { EditableSelectCell } from "./EditableSelectCell";
import { EditableTextCell } from "./EditableTextCell";
import { EditableUrlCell } from "./EditableUrlCell";

const registry: Record<EditableCellType, React.FC<CellRendererProps>> = {
  text: EditableTextCell,
  number: EditableNumberCell,
  "date-single": EditableDateCell,
  select: EditableSelectCell,
  url: EditableUrlCell,
};

export function getCellRenderer(type: EditableCellType | undefined) {
  return registry[type ?? "text"];
}
