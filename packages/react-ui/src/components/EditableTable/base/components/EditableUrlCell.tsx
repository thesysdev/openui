import React from "react";
import type { CellRendererProps } from "./CellTypes";
import { TextBaseEditableCell } from "./TextBaseEditableCell";

export const EditableUrlCell: React.FC<CellRendererProps> = (props) => (
  <TextBaseEditableCell
    {...props}
    inputType="url"
    parseOnSave={(raw) => raw}
    renderDisplay={(value) => (value === undefined || value === null ? "" : String(value))}
  />
);

export default EditableUrlCell;
