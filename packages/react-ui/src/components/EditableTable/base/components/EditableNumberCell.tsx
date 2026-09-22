import React from "react";
import type { CellRendererProps } from "./CellTypes";
import { TextBaseEditableCell } from "./TextBaseEditableCell";

export const EditableNumberCell: React.FC<CellRendererProps> = (props) => (
  <TextBaseEditableCell
    {...props}
    inputType="number"
    parseOnSave={(raw) => {
      const parsed = parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    }}
    renderDisplay={(value) => (value === undefined || value === null ? "" : String(value))}
  />
);

export default EditableNumberCell;
