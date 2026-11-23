// The theme provider lives in @openuidev/react-components. Re-exporting it keeps one React context
// for both packages, so a single ThemeProvider themes react-ui and react-components together.
export { ThemeContext, ThemeProvider, useTheme } from "@openuidev/react-components/theme";
export type { ThemeProps } from "@openuidev/react-components/theme";
