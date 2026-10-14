import * as os from "node:os";
import * as path from "node:path";

/** Per-user OpenUI CLI state directory (`$XDG_CONFIG_HOME/openui`, else `~/.config/openui`). */
export const configDir = () =>
  path.join(process.env["XDG_CONFIG_HOME"] ?? path.join(os.homedir(), ".config"), "openui");
