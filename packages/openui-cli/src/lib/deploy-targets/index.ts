import type { DeployTarget, DeployTargetOptions } from "../deploy";
import { deployToVercel } from "./vercel";
import { CreateError } from "../telemetry";

/** Dispatch to a platform adapter (Vercel today). */
export async function deployToTarget(
  target: DeployTarget,
  opts: DeployTargetOptions,
): Promise<void> {
  switch (target) {
    case "vercel":
      return deployToVercel(opts);
    default: {
      const _exhaustive: never = target;
      throw new CreateError(
        "deploy_target",
        `Unsupported deploy target: ${String(_exhaustive)}`,
        "invalid_input",
        "UNSUPPORTED_TARGET",
      );
    }
  }
}
