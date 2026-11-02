"use client";

import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DatePicker } from "../../../DatePicker";
import { useEditableCellKeyboard } from "../hooks/useEditableCellKeyboard";
import { CellOutline } from "./CellOutline";
import type { CellRendererProps, EditableTableMeta } from "./CellTypes";
import { names as cellNames, editableCellStyles } from "./editableCell.styles";

/** Table cells store dates as ISO strings; parse them back for the picker. */
function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export const EditableDateCell: React.FC<CellRendererProps> = (props) => {
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

  const cellStyles = editableCellStyles;
  const [editDate, setEditDate] = useState<Date | undefined>(toDate(value));
  const cellRef = useRef<HTMLDivElement>(null);
  const updateTableData = (table.options.meta as EditableTableMeta | undefined)?.updateData;

  useEffect(() => {
    if (!isEditing) setEditDate(toDate(value));
  }, [value, isEditing]);

  useEffect(() => {
    if (isSelected && !isEditing && cellRef.current) {
      cellRef.current.focus();
    }
  }, [isSelected, isEditing]);

  const handleCancel = useCallback(() => {
    setEditDate(toDate(value));
    onFinishEdit(false);
  }, [value, onFinishEdit]);

  const { handleKeyDown } = useEditableCellKeyboard({
    isEditing,
    isSelected,
    rowIndex,
    columnId,
    onNavigate,
    onStartEdit,
    // DatePicker handles saving itself
    onSave: () => {},
    onCancel: handleCancel,
  });

  // When DatePicker is open, intercept Tab/Enter/Escape similar to the Select cell
  const handleKeyDownWithPicker = useCallback(
    (e: React.KeyboardEvent) => {
      if (isEditing) {
        switch (e.key) {
          case "Tab":
            e.preventDefault();
            e.stopPropagation();
            onNavigate(e.shiftKey ? "left" : "right");
            return;
          case "Enter":
            e.preventDefault();
            e.stopPropagation();
            onNavigate("down");
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
    [isEditing, handleCancel, onNavigate, handleKeyDown],
  );

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) {
      return;
    }
    e.stopPropagation();
    if (!isSelected) {
      onSelect(rowIndex, columnId);
    } else {
      onStartEdit(rowIndex, columnId);
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setEditDate(date);
    // Auto-save on date selection
    updateTableData?.(rowIndex, columnId, date?.toISOString());
    onFinishEdit(true);
  };

  return (
    <div
      ref={cellRef}
      className={clsx(cellStyles.cell, cellNames.cell)}
      onClickCapture={handleClick}
      onKeyDown={handleKeyDownWithPicker}
      tabIndex={0}
      data-state={isEditing ? "editing" : isSelected ? "selected" : "idle"}
    >
      <CellOutline isSelected={isSelected} isEditing={isEditing} />
      <DatePicker
        selectedSingleDate={editDate}
        setSelectedSingleDate={handleDateChange}
        mode="single"
        isOpen={isEditing}
        setIsOpen={(isOpen) => {
          if (!isOpen) {
            onFinishEdit(true);
          }
        }}
      />
    </div>
  );
};

export default EditableDateCell;
