import type { CommandResult } from "../process-runner";
import { CliCancelledError, CreateError } from "../telemetry";
import { processErrorProperties } from "../utils";

export function throwCommandFailure(result: CommandResult, stage: string, message: string): never {
  const properties = processErrorProperties(result, stage, {
    error_class: "process",
    error_code: "NONZERO_EXIT",
  });
  if (properties.error_class === "user_cancelled") {
    throw new CliCancelledError(stage, properties.cancellation_exit_code ?? 0, properties);
  }
  const { failure_stage, error_class, error_code, ...metadata } = properties;
  throw new CreateError(failure_stage, message, error_class, error_code, metadata);
}
