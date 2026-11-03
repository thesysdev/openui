// Svg and the shapes drawn inside it: a drawing's parts live with the drawing,
// as chat-kit keeps its charts and their Series, Point and Slice together.
import { Svg } from "./Svg";
import { G } from "./G";
import { Circle } from "./Circle";
import { Ellipse } from "./Ellipse";
import { Rect } from "./Rect";
import { Line } from "./Line";
import { Path } from "./Path";
import { Polyline } from "./Polyline";
import { Polygon } from "./Polygon";
import { SvgText } from "./SvgText";

export { Svg, SvgSchema } from "./Svg";
export { G, GSchema } from "./G";
export { Circle, CircleSchema } from "./Circle";
export { Ellipse, EllipseSchema } from "./Ellipse";
export { Rect, RectSchema } from "./Rect";
export { Line, LineSchema } from "./Line";
export { Path, PathSchema } from "./Path";
export { Polyline, PolylineSchema } from "./Polyline";
export { Polygon, PolygonSchema } from "./Polygon";
export { SvgText, SvgTextSchema } from "./SvgText";

export const svgComponents = [Svg, Circle, Ellipse, Rect, Line, Path, Polyline, Polygon, G, SvgText];
