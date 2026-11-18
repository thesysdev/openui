// @openui-channels ui: shared, dependency-free UI contracts. The chart
// rasterizer lives at the "./ui/charts" subpath because it carries heavy
// optional peer deps (react, recharts, native resvg) - import it only when
// delivering charts as images.
export type { ChartSpec, FieldSpec, FormSpec } from "./types";
