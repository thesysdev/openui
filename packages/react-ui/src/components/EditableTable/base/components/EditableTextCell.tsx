import React from "react";
import type { CellRendererProps } from "./CellTypes";
import { TextBaseEditableCell } from "./TextBaseEditableCell";

export const EditableTextCell: React.FC<CellRendererProps> = (props) => (
  <TextBaseEditableCell {...props} inputType="text" parseOnSave={(raw) => raw} />
);

export default EditableTextCell;
