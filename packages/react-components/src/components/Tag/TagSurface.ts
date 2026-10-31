import { createContext } from "react";
import type { TagSurface } from "./Tag";

/**
 * The surface a card lays its Tags on. Context and Visual cards provide `"image"` for the Tags a
 * caller puts in their tag slot, so a Tag takes the overlay look without the caller passing it.
 * A Tag's own `surface` prop wins. Internal: not exported from the package.
 */
export const TagSurfaceContext = createContext<TagSurface | undefined>(undefined);
