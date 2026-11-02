"use client";

import clsx from "clsx";
import { Info, Link } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { safeUrl } from "../../../_shared/utils/safeUrl";
import { TooltipWrapper } from "../../../TooltipWrapper";
import { useEditableCellKeyboard } from "../hooks/useEditableCellKeyboard";
import { isValidUrl } from "../utils/utilsFn";
import { CellOutline } from "./CellOutline";
import type { CellRendererProps, EditableTableMeta } from "./CellTypes";
import { names as cellNames, editableCellStyles } from "./editableCell.styles";

export interface TextBaseEditableCellProps extends CellRendererProps {
  inputType: "text" | "number" | "url";
  parseOnSave: (raw: string) => any;
  renderDisplay?: (value: any) => React.ReactNode;
}

const toDisplayString = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

export const TextBaseEditableCell: React.FC<TextBaseEditableCellProps> = ({
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
  inputType,
  parseOnSave,
  renderDisplay,
}) => {
  const cellStyles = editableCellStyles;
  const [editValue, setEditValue] = useState<string>(toDisplayString(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const updateTableData = (table.options.meta as EditableTableMeta | undefined)?.updateData;

  // Sync the edit buffer from the table only while not editing, so a re-render
  // caused by another cell's save cannot clobber in-progress typing.
  useEffect(() => {
    if (!isEditing) setEditValue(toDisplayString(value));
  }, [value, isEditing]);

  // Set when the user cancels; the blur that follows must not commit the value.
  const justCancelledRef = useRef(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isSelected && !isEditing && cellRef.current) {
      cellRef.current.focus();
    }
  }, [isSelected, isEditing]);

  const handleSave = useCallback(() => {
    const processedValue = parseOnSave(editValue);
    updateTableData?.(rowIndex, columnId, processedValue);
    onFinishEdit(true);
  }, [editValue, parseOnSave, rowIndex, columnId, updateTableData, onFinishEdit]);

  const handleCancel = useCallback(() => {
    justCancelledRef.current = true;
    setEditValue(toDisplayString(value));
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
    onStartEditWithChar: (char) => setEditValue(char),
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Let the url cell's anchor handle its own click.
    if ((e.target as HTMLElement).closest("a")) return;
    e.stopPropagation();
    if (!isSelected && !isEditing) {
      onSelect(rowIndex, columnId);
    } else {
      onStartEdit(rowIndex, columnId);
    }
  };

  const handleContainerBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (justCancelledRef.current) {
      justCancelledRef.current = false;
      return;
    }
    if (!isEditing) return;
    const currentTarget = e.currentTarget;
    const nextFocusedElement = e.relatedTarget as Node | null;
    if (nextFocusedElement && currentTarget.contains(nextFocusedElement)) {
      return;
    }
    handleSave();
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type={inputType}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={clsx(cellStyles.input, cellNames.input)}
        />
      );
    }
    const display = renderDisplay ? renderDisplay(value) : (value ?? "");
    if (inputType === "url") {
      const rawHref = toDisplayString(value);
      const safeHref = safeUrl(rawHref);
      const isValid = isValidUrl(rawHref) && safeHref !== undefined;
      return (
        <div className={clsx(cellStyles.urlContainer, cellNames.urlContainer)}>
          <Link size={16} className={clsx(cellStyles.urlIcon, cellNames.urlIcon)} />
          {safeHref ? (
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(cellStyles.url, cellNames.url)}
              onClick={(e) => e.stopPropagation()}
            >
              {display}
            </a>
          ) : (
            <span
              className={clsx(cellStyles.url, cellNames.url)}
              onClick={(e) => e.stopPropagation()}
            >
              {display}
            </span>
          )}
          {!isValid && (
            <TooltipWrapper tooltipContent="This might not be a valid URL" side="right">
              <div className={cellNames.warningContainer}>
                <Info size={16} className={clsx(cellStyles.warning, cellNames.warning)} />
              </div>
            </TooltipWrapper>
          )}
        </div>
      );
    }
    return (
      <span
        className={clsx(
          inputType === "text" ? cellStyles.text : cellStyles.number,
          inputType === "text" ? cellNames.text : cellNames.number,
        )}
      >
        {display}
      </span>
    );
  };

  return (
    <div
      ref={cellRef}
      className={clsx(cellStyles.cell, cellNames.cell)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onBlur={handleContainerBlur}
      tabIndex={0}
      data-state={isEditing ? "editing" : isSelected ? "selected" : "idle"}
    >
      <CellOutline isSelected={isSelected} isEditing={isEditing} />
      {renderContent()}
    </div>
  );
};

export default TextBaseEditableCell;
