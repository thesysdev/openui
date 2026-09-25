/**
 * Entry point for the OpenUI CLI spec generator.
 *
 * `pnpm generate` runs `openui generate src/library.ts --spec`, which bundles
 * this file (stubbing asset imports) and reads the `library` + `promptOptions`
 * exports to write `src/generated/spec.json`.
 */
export { openuiLibrary as library } from "@openuidev/react-ui/genui-lib";
export { promptOptions } from "./lib/prompt-options";
