import { groups } from "./registeredGroups";
import { structure } from "./structure";

export * from "./slots";
// Structure follows slot registration so its schemas can resolve the other groups.
export const componentGroups = [structure, ...groups];
export const groupComponents = componentGroups.flatMap((group) => group.components);
