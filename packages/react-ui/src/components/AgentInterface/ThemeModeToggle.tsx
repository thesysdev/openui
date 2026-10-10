import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import type { ThemeMode } from "../ThemeProvider/types";
import { SidebarTooltip } from "./SidebarTooltip";

export interface ThemeModeToggleProps {
  /** The mode currently shown. Pair with `useThemeModePreference`. */
  mode: ThemeMode;
  /** Called with the other mode when the button is pressed. */
  onModeChange: (next: ThemeMode) => void;
  className?: string;
}

/**
 * Round icon button that flips between light and dark, for the sidebar footer.
 * It shows the mode it switches to (a moon in light mode, a sun in dark), the
 * same in the expanded sidebar and on the collapsed rail.
 */
export const ThemeModeToggle = ({ mode, onModeChange, className }: ThemeModeToggleProps) => {
  const next: ThemeMode = mode === "dark" ? "light" : "dark";
  const label = `Switch to ${next} theme`;

  return (
    <SidebarTooltip content={label}>
      <button
        type="button"
        className={clsx("openui-agent-theme-toggle", className)}
        aria-label={label}
        onClick={() => onModeChange(next)}
      >
        {next === "dark" ? (
          <Moon size="1em" aria-hidden="true" />
        ) : (
          <Sun size="1em" aria-hidden="true" />
        )}
      </button>
    </SidebarTooltip>
  );
};
