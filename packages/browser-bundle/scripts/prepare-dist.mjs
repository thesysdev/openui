import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(dirname, "..", "dist");

await rm(distDir, { force: true, recursive: true });
await mkdir(distDir, { recursive: true });
