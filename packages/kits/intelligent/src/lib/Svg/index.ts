// Svg and the shapes drawn inside it: a drawing's parts live with the drawing,
// as chat-kit keeps its charts and their Series, Point and Slice together.
import { G, shapeComponents } from "./G";
import { Svg } from "./Svg";

export { Circle, CircleSchema } from "./Circle";
export { Ellipse, EllipseSchema } from "./Ellipse";
export { G, GSchema } from "./G";
export { Line, LineSchema } from "./Line";
export { Path, PathSchema } from "./Path";
export { Polygon, PolygonSchema } from "./Polygon";
export { Polyline, PolylineSchema } from "./Polyline";
export { Rect, RectSchema } from "./Rect";
export { Svg, SvgSchema } from "./Svg";
export { SvgText, SvgTextSchema } from "./SvgText";

export const svgComponents = [Svg, ...shapeComponents, G];
