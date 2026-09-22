import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { checkoutSource } from "../checkout";
import { cliErrorProperties, CreateError } from "../errors";
import type { RetryAttemptInfo } from "../retry";

export const TEMPLATES_DIR = "templates";

export type ResolvedTemplate = {
  dir: string;
};

export function templateSourceError(err: unknown, template: string): CreateError {
  const properties = cliErrorProperties(err, {
    failure_stage: "preflight",
    error_class: "network",
    error_code: "TEMPLATE_MISSING",
  });
  const detail = err instanceof Error ? err.message : String(err);
  const message =
    properties.error_class === "network"
      ? `Could not download template "${template}" from GitHub: ${detail}. Check your network connection and try again.`
      : `Could not prepare template "${template}": ${detail}`;
  return new CreateError(
    properties.failure_stage,
    message,
    properties.error_class,
    properties.error_code,
  );
}

export async function resolveTemplateSource(
  template: string,
  opts: { onRetry?: (info: RetryAttemptInfo) => void } = {},
): Promise<ResolvedTemplate> {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "openui-template-"));
  try {
    const checkedOut = await checkoutSource(`${TEMPLATES_DIR}/${template}`, {
      dest,
      onRetry: opts.onRetry,
    });
    return { dir: checkedOut.dir };
  } catch (err) {
    fs.rmSync(dest, { recursive: true, force: true });
    if (err instanceof CreateError) throw err;
    throw templateSourceError(err, template);
  }
}
