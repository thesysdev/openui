// The theme provider on its own, without the component barrel or the default-token style tags
// that the package root adds on import. @openuidev/react-ui re-exports this entry, so both
// packages share one theme context.
export * from "./components/ThemeProvider";
