"use client";
import type { ReactNode } from "react";
import { CompareProvider } from "../../../shared/compare";
import { FilterRegistryProvider } from "../../../shared/filterRegistry";
import { StyleClassesContext } from "../../../shared/styleClasses";
import { RefreshingContext } from "../../../shared/viewState";
import { DashboardError } from "../../shared/States";
import { DashboardTheme } from "../../ThemeProvider";
export interface DashboardProps {
  /** Each style block's compiled class, by block name; all of them go on the root. */
  styleClasses: Readonly<Record<string, string>>;
  children: ReactNode;
  refreshing: boolean;
  hasErrors: boolean;
  empty: boolean;
}
export function Dashboard({
  styleClasses,
  children,
  refreshing,
  hasErrors,
  empty,
}: DashboardProps) {
  const className = Object.values(styleClasses).join(" ");
  return (
    <StyleClassesContext.Provider value={styleClasses}>
      <DashboardTheme>
        <CompareProvider>
          <FilterRegistryProvider>
            <div className={`${className} openui-dashboard-root openui-dashboard-container`}>
              <div className="openui-dashboard-dashboard" aria-busy={refreshing || undefined}>
                {hasErrors ? (
                  <p className="openui-dashboard-dashboard-notice" role="alert">
                    <span className="openui-dashboard-state-title">Some live data didn’t load</span>
                    <span className="openui-dashboard-state-hint">
                      Cards that use it may be out of date.
                    </span>
                  </p>
                ) : null}
                {/* Finished with nothing to draw: every section was invalid. */}
                <RefreshingContext.Provider value={refreshing}>
                  {empty ? <DashboardError /> : children}
                </RefreshingContext.Provider>
              </div>
            </div>
          </FilterRegistryProvider>
        </CompareProvider>
      </DashboardTheme>
    </StyleClassesContext.Provider>
  );
}
