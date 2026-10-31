"use client";

import { useCallback, useState } from "react";
import { readPreference, writePreference } from "../../utils/preferences";
import { useIsomorphicLayoutEffect } from "../../utils/useIsomorphicLayoutEffect";
import type { ThemeMode } from "./types";
import { useSystemThemeMode } from "./useSystemThemeMode";

/** A user's theme choice: a fixed mode, or follow the OS. */
export type ThemeModePreference = ThemeMode | "system";

/** localStorage key the preference is saved under (unset means "system"). */
export const THEME_MODE_STORAGE_KEY = "openui-theme-mode";

/**
 * Attribute set on <html> while a mode is pinned. The default token sheet
 * (openui-defaults) reads it, so pages outside AgentInterface follow the
 * chosen mode too.
 */
export const THEME_MODE_ATTRIBUTE = "data-openui-theme";

const isPreference = (value: unknown): value is ThemeModePreference =>
  value === "light" || value === "dark" || value === "system";

/**
 * The user's Light / Dark / System choice, saved to localStorage and mirrored
 * onto <html> as `data-openui-theme`. Returns the choice, a setter, and the
 * resolved `mode` to pass to `<ThemeProvider mode>` (or `theme={{ mode }}`).
 */
export function useThemeModePreference(storageKey: string = THEME_MODE_STORAGE_KEY): {
  preference: ThemeModePreference;
  setPreference: (next: ThemeModePreference) => void;
  mode: ThemeMode;
} {
  const systemMode = useSystemThemeMode();
  // "system" for the first render (as on the server), then the saved choice
  // before paint, so server-rendered markup hydrates cleanly.
  const [preference, setPreferenceState] = useState<ThemeModePreference>("system");
  useIsomorphicLayoutEffect(() => {
    const saved = readPreference(storageKey);
    setPreferenceState(isPreference(saved) ? saved : "system");
  }, [storageKey]);

  const setPreference = useCallback(
    (next: ThemeModePreference) => {
      setPreferenceState(next);
      writePreference(storageKey, next === "system" ? undefined : next);
    },
    [storageKey],
  );

  const mode: ThemeMode = preference === "system" ? systemMode : preference;

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    if (preference === "system") root.removeAttribute(THEME_MODE_ATTRIBUTE);
    else root.setAttribute(THEME_MODE_ATTRIBUTE, preference);
    root.style.colorScheme = mode;
  }, [preference, mode]);

  return { preference, setPreference, mode };
}
