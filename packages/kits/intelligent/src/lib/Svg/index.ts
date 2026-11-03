// Svg and the shapes drawn inside it: a drawing's parts live with the drawing,
// as chat-kit keeps its charts and their Series, Point and Slice together.
import { G, shapeComponents } from "./G";
import { Svg } from "./Svg";

export const svgComponents = [Svg, ...shapeComponents, G];
