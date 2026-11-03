import { TextBlockView } from "@openuidev/react-components";
import clsx from "clsx";
import { Children, type ReactNode } from "react";
import { names, styles } from "./dashboardCardHeader.styles";

export interface DashboardCardHeaderProps {
  title: string;
  subtitle?: string;
  titleType?: "text" | "number";
  controls?: ReactNode;
}

export function DashboardCardHeader({
  title,
  subtitle,
  titleType = "text",
  controls,
}: DashboardCardHeaderProps) {
  return (
    <div className={clsx(styles.root, names.root)}>
      <div className={clsx(styles.main, names.main)}>
        <div className={clsx(styles.content, names.content)}>
          <TextBlockView
            className={clsx(
              titleType === "number" ? styles.numberTitle : styles.textTitle,
              names.title,
            )}
            variant={titleType === "number" ? "number-title-text" : "title-text"}
            primary={title}
            secondary={subtitle}
            type={titleType}
            size="xs"
            align="left"
          />
        </div>
      </div>
      {Children.count(controls) ? (
        <div className={clsx(styles.controls, names.controls)}>{controls}</div>
      ) : null}
    </div>
  );
}
