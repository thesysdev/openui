"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { ThemeProvider } from "../ThemeProvider";
import { useIsInsideTheme } from "../ThemeProvider/ThemeProvider";
import { names, styles } from "./dashboard.styles";

export interface DashboardProps {
  children?: ReactNode;
}

export function Dashboard({ children }: DashboardProps) {
  const root = <div className={clsx(styles.root, names.root)}>{children}</div>;
  // Reuse a theme the caller already provides instead of overriding it.
  if (useIsInsideTheme()) return root;
  return <ThemeProvider>{root}</ThemeProvider>;
}
