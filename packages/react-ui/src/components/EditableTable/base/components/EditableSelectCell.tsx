import React, { useCallback, useEffect, useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../Select";
import { useEditableCellKeyboard } from "../hooks/useEditableCellKeyboard";
import { CellOutline } from "./CellOutline";
import type { CellRendererProps, EditableColumnMeta, EditableTableMeta } from "./CellTypes";

export const EditableSelectCell: React.FC<CellRendererProps> = (props) => {
  const {
    value,
    rowIndex,
    columnId,
    isSelected,
    isEditing,
    onSelect,
    onStartEdit,
    onFinishEdit,
    onNavigate,
    table,
  } = props;

  const [editValue, setEditValue] = useState<string>((value as string) || "");
  const cellRef = useRef<HTMLDivElement>(null);

  // Get options from column definition through table instance
  const column = table.getColumn(columnId);
  const options = (column?.columnDef?.meta as EditableColumnMeta | undefined)?.options ?? [];
  const updateTableData = (table.options.meta as EditableTableMeta | undefined)?.updateData;

  useEffect(() => {
    if (!isEditing) setEditValue((value as string) || "");
  }, [value, isEditing]);

  useEffect(() => {
    if (isSelected && !isEditing && cellRef.current) {
      cellRef.current.focus();
    }
  }, [isSelected, isEditing]);

  const handleSave = useCallback(() => {
    updateTableData?.(rowIndex, columnId, editValue);
    onFinishEdit(true);
  }, [editValue, rowIndex, columnId, updateTableData, onFinishEdit]);

  const handleCancel = useCallback(() => {
    setEditValue((value as string) || "");
    onFinishEdit(false);
  }, [value, onFinishEdit]);

  const { handleKeyDown } = useEditableCellKeyboard({
    isEditing,
    isSelected,
    rowIndex,
    columnId,
    onNavigate,
    onStartEdit,
    onSave: handleSave,
    onCancel: handleCancel,
  });

  // When Select is open and in editing mode, intercept certain keys
  const handleKeyDownWithSelect = useCallback(
    (e: React.KeyboardEvent) => {
      if (isEditing) {
        switch (e.key) {
          case "Tab":
            e.preventDefault();
            e.stopPropagation();
            handleSave();
            onNavigate(e.shiftKey ? "left" : "right");
            return;
          case "Escape":
            e.preventDefault();
            e.stopPropagation();
            handleCancel();
            return;
        }
      }
      handleKeyDown(e);
    },
    [isEditing, handleSave, handleCancel, onNavigate, handleKeyDown],
  );

  const handleClick = () => {
    if (!isSelected && !isEditing) {
      onSelect(rowIndex, columnId);
    } else if (isSelected && !isEditing) {
      onStartEdit(rowIndex, columnId);
    }
  };

  const handleValueChange = (newValue: string) => {
    setEditValue(newValue);
    // Save and finish editing on selection
    updateTableData?.(rowIndex, columnId, newValue);
    onFinishEdit(true);
  };

  // Handle when Select closes without selecting
  const handleOpenChange = (open: boolean) => {
    if (!open && isEditing) {
      onFinishEdit(false);
    }
  };

  return (
    <div
      ref={cellRef}
      className="openui-editable-table-cell-base"
      onClick={handleClick}
      onKeyDown={handleKeyDownWithSelect}
      tabIndex={0}
      style={{ outline: "none" }}
    >
      <CellOutline isSelected={isSelected} isEditing={isEditing} />
      <Select
        value={editValue}
        onValueChange={handleValueChange}
        open={isEditing}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger className="openui-editable-table-select-trigger">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="openui-editable-table-select-item"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default EditableSelectCell;
