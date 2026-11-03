import clsx from "clsx";
import type { ReactNode } from "react";
import { names, styles } from "./filterBar.styles";

export interface FilterBarProps {
  children?: ReactNode;
  rightChildren?: ReactNode;
  compact?: boolean;
}

export function FilterBar({ children, rightChildren, compact }: FilterBarProps) {
  return (
    <div className={clsx(styles.root, names.root, compact && [styles.compact, names.compact])}>
      <div className={clsx(styles.side, names.side, styles.left, names.left)}>{children}</div>
      {rightChildren ? (
        <div className={clsx(styles.side, names.side, styles.right, names.right)}>
          {rightChildren}
        </div>
      ) : null}
    </div>
  );
}
