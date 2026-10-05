import { createTheme, type Theme } from "@mui/material/styles";

/**
 * Builds the Material UI theme for the chat surface. The same factory is used
 * for both light and dark mode — pass the desired palette mode.
 */
export function createAppTheme(mode: "light" | "dark"): Theme {
  return createTheme({
    palette: {
      mode,
      primary: { main: mode === "dark" ? "#90caf9" : "#1976d2" },
      secondary: { main: mode === "dark" ? "#ce93d8" : "#9c27b0" },
      ...(mode === "dark"
        ? { background: { default: "#0b0f14", paper: "#121821" } }
        : { background: { default: "#f7f8fa", paper: "#ffffff" } }),
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily:
        'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      h1: { fontSize: "1.8rem", fontWeight: 700 },
      h2: { fontSize: "1.5rem", fontWeight: 700 },
      h3: { fontSize: "1.25rem", fontWeight: 600 },
      h4: { fontSize: "1.1rem", fontWeight: 600 },
    },
    components: {
      MuiCard: {
        defaultProps: { variant: "outlined" },
      },
    },
  });
}

/** Categorical palette shared by all charts so series colors stay consistent. */
export const CHART_PALETTE = [
  "#1976d2",
  "#9c27b0",
  "#2e7d32",
  "#ed6c02",
  "#0288d1",
  "#d32f2f",
];
