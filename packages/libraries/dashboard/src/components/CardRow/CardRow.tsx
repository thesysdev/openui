import clsx from "clsx";
import type { ReactNode } from "react";
import { names, styles } from "./cardRow.styles";

export type CardRowType = "small" | "medium" | "medium-large" | "large";

export interface CardRowProps {
  align?: "start" | "stretch";
  /** Which card sizes the row holds; drives its responsive flex basis. */
  type?: CardRowType;
  /** Number of cards in the row. */
  count: number;
  children?: ReactNode;
}

export function CardRow({ align = "stretch", type, count, children }: CardRowProps) {
  return (
    <div
      data-count={count}
      className={clsx(
        styles.root,
        names.root,
        styles.align[align],
        names.align[align],
        type && [styles.type[type], names.type[type]],
      )}
    >
      {children}
    </div>
  );
}
