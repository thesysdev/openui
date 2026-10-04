import type { DeployTarget, DeployTargetOptions } from "..";
import { CreateError } from "../../../../lib/errors";
import { deployToVercel } from "./vercel";

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
