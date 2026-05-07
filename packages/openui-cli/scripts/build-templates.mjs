import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(dirname, "..");
const sourceDir = path.join(packageDir, "src", "templates", "openui-chat");
const templatesDir = path.join(packageDir, "dist", "templates");
const targetDir = path.join(templatesDir, "openui-chat");

await rm(targetDir, { force: true, recursive: true });
await mkdir(templatesDir, { recursive: true });
await cp(sourceDir, targetDir, { recursive: true });
