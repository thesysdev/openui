import { useMemo, type FC, type ReactNode } from "react";
import {
  ThemeProvider,
  useTheme,
  type Theme,
  type ThemeMode,
} from "../../../components/ThemeProvider";
import { DASHBOARD_CLASS_PREFIX } from "../classPrefix";
import { defaultDashboardDarkTheme, defaultDashboardLightTheme } from "./defaultThemes";

export interface DashboardThemeProviderProps {
  children: ReactNode;
  /** Overrides the mode read from the outer `<ThemeProvider>`. */
  mode?: ThemeMode;
  /** Shallow-merged over the default light Dashboard theme. */
  lightTheme?: Partial<Theme>;
  /** Shallow-merged over the default dark Dashboard theme. */
  darkTheme?: Partial<Theme>;
}

/**
 * Applies dashboard-scale typography while inheriting the ambient color mode.
 * The scoped compound fonts cover the heavier metric and table-header roles
 * that the standard theme's typography shorthand scale does not provide.
 */
export const DashboardThemeProvider: FC<DashboardThemeProviderProps> = ({
  children,
  mode: modeOverride,
  lightTheme,
  darkTheme,
}) => {
  const { mode: ambientMode } = useTheme();
  const mode: ThemeMode = modeOverride ?? ambientMode;

  const mergedLight = useMemo<Theme>(
    () => ({ ...defaultDashboardLightTheme, ...lightTheme }),
    [lightTheme],
  );

  const mergedDark = useMemo<Theme>(
    () => ({ ...defaultDashboardDarkTheme, ...darkTheme }),
    [darkTheme],
  );

  return (
    <div className={`${DASHBOARD_CLASS_PREFIX}-theme`} style={{ display: "contents" }}>
      <style>{`
        .${DASHBOARD_CLASS_PREFIX}-theme {
          /* 700 @ 14px, prose leading — highlight-text card copy. */
          --${DASHBOARD_CLASS_PREFIX}-font-highlight: 700 14px/1.5 var(--openui-font-body);
          /* 700 @ 14px, label leading — the primary metric value. */
          --${DASHBOARD_CLASS_PREFIX}-font-metric: 700 14px/1.25 var(--openui-font-body);
          /* 700 @ 20px — the oversized highlight metric. */
          --${DASHBOARD_CLASS_PREFIX}-font-metric-lg: 700 20px/1.25 var(--openui-font-body);
          /* 600 @ 13px — secondary metric chrome (previous value, trend). */
          --${DASHBOARD_CLASS_PREFIX}-font-metric-sm: 600 13px/1.25 var(--openui-font-body);
          /* 600 @ 13px on the label family — table column headers. */
          --${DASHBOARD_CLASS_PREFIX}-font-table-header: 600 13px/1.25 var(--openui-font-label);
        }
      `}</style>
      <ThemeProvider
        mode={mode}
        lightTheme={mergedLight}
        darkTheme={mergedDark}
        cssSelector={`.${DASHBOARD_CLASS_PREFIX}-theme`}
      >
        {children}
      </ThemeProvider>
    </div>
  );
};
