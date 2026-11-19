import type { Group } from "../group";
import { FlowComponent } from "./Flow";
import { FunnelComponent } from "./Funnel";
// Composition owns the stylesheet shared by these charts; attach it only once.
export const flow: Group = { components: [FunnelComponent, FlowComponent], styles: {} };
