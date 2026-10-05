// Stands in for "@openuidev/observability". Never a second bus: mount()
// resolves the host's bus (Symbol.for("openui.observability"), or an
// explicit opts.bus) before this module loads, and refuses to mount at all
// if neither is present
import { slot } from "./slots";

export const observability = slot.bus!;

export type {
  Observability,
  ObservabilityDetail,
  ObservabilityErrorInfo,
  ObservabilityEvent,
  ObservabilityLevel,
  Remove,
} from "@openuidev/observability";
