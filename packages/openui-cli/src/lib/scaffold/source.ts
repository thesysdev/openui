import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { checkoutSource } from "../checkout";
import { CreateError } from "../errors";

export const TEMPLATES_DIR = "templates";

export type ResolvedTemplate = {
  dir: string;
};

export async function resolveTemplateSource(template: string): Promise<ResolvedTemplate> {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "openui-template-"));
  try {
    const checkedOut = await checkoutSource(`${TEMPLATES_DIR}/${template}`, { dest });
    return { dir: checkedOut.dir };
  } catch (err) {
    fs.rmSync(dest, { recursive: true, force: true });
    if (err instanceof CreateError) throw err;
    throw new CreateError(
      "preflight",
      err instanceof Error ? err.message : String(err),
      "network",
      "TEMPLATE_MISSING",
    );
  }
}
