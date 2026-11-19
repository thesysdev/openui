"use client";

import clsx from "clsx";
import React from "react";
import { editableCellStyles, names } from "./editableCell.styles";

export interface CellOutlineProps {
  isSelected: boolean;
  isEditing: boolean;
}

const SIDES = ["top", "bottom", "left", "right"] as const;

export const CellOutline: React.FC<CellOutlineProps> = ({ isSelected, isEditing }) => {
  const styles = editableCellStyles;
  return (
    <>
      {SIDES.map((side) => (
        <div
          key={side}
          data-state={isEditing ? "editing" : isSelected ? "selected" : "idle"}
          className={clsx(
            side === "top" || side === "bottom" ? styles.horizontalOutline : styles.verticalOutline,
            styles[side],
            names[side],
          )}
        />
      ))}
    </>
  );
};

export default CellOutline;
