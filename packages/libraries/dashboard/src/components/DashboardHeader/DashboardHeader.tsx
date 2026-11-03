import clsx from "clsx";
import { Children, type ReactNode } from "react";
import { names, styles } from "./dashboardHeader.styles";

export interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  controls?: ReactNode;
}

export function DashboardHeader({ title, subtitle, controls }: DashboardHeaderProps) {
  return (
    <header className={clsx(styles.root, names.root)}>
      <div className={clsx(styles.content, names.content)}>
        <div className={clsx(styles.title, names.title)}>{title}</div>
        {subtitle ? <div className={clsx(styles.subtitle, names.subtitle)}>{subtitle}</div> : null}
      </div>
      {Children.count(controls) ? (
        <div className={clsx(styles.controls, names.controls)}>{controls}</div>
      ) : null}
    </header>
  );
}
