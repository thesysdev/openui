// Dashboards are built from a shadcn/ui component library, with Query() for live data.
// `npm run generate` writes its specification, which the server builds dashboards from; the
// browser renders dashboards with the library itself.
export { dashboardLibrary as library } from "./lib/shadcn-genui";
