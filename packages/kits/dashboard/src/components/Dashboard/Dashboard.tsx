"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { DashboardThemeProvider } from "../DashboardThemeProvider";
import { names, styles } from "./dashboard.styles";

export interface DashboardProps {
  children?: ReactNode;
}

export function Dashboard({ children }: DashboardProps) {
  return (
    <DashboardThemeProvider>
      <div className={clsx(styles.root, names.root)}>{children}</div>
    </DashboardThemeProvider>
  );
}
