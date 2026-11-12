export * from "./defaultThemes";
import type { ComponentProps } from "react";
import type { ThemeProvider } from "./ThemeProvider";

export * from "./ThemeProvider";
/** Props of the dashboard {@link ThemeProvider}. */
export type ThemeProviderProps = ComponentProps<typeof ThemeProvider>;
