"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../../../ThemeProvider";
import { useEditableCellKeyboard } from "../hooks/useEditableCellKeyboard";
import { CellOutline } from "./CellOutline";
import type { CellRendererProps, EditableColumnMeta, EditableTableMeta } from "./CellTypes";
import { names as cellNames, editableCellStyles } from "./editableCell.styles";
import { editableSelectCellStyles, names } from "./editableSelectCell.styles";

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

  const styles = editableSelectCellStyles;
  const { portalThemeClassName } = useTheme();
  const cellStyles = editableCellStyles;
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
      className={clsx(cellStyles.cell, cellNames.cell)}
      onClick={handleClick}
      onKeyDown={handleKeyDownWithSelect}
      tabIndex={0}
      data-state={isEditing ? "editing" : isSelected ? "selected" : "idle"}
    >
      <CellOutline isSelected={isSelected} isEditing={isEditing} />
      <SelectPrimitive.Root
        value={editValue}
        onValueChange={handleValueChange}
        open={isEditing}
        onOpenChange={handleOpenChange}
      >
        <SelectPrimitive.Trigger className={clsx(styles.trigger, names.trigger)}>
          <span className={names.value}>
            <SelectPrimitive.Value placeholder="Select an option" />
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown className={clsx(styles.icon, names.icon)} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={clsx(styles.content, names.content, portalThemeClassName)}
            position="popper"
            sideOffset={2}
          >
            <SelectPrimitive.Viewport className={clsx(styles.viewport, names.viewport)}>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={clsx(styles.item, names.item)}
                >
                  <span className={clsx(styles.checkWrapper, names.checkWrapper)}>
                    <SelectPrimitive.ItemIndicator className={names.indicator}>
                      <Check className={clsx(styles.checkIcon, names.checkIcon)} />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <span className={names.itemText}>
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  </span>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
};

export default EditableSelectCell;
