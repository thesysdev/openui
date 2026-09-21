import { spawn } from "node:child_process";
import "./generate.mjs";
const children = [
  spawn(process.execPath, ["--watch", "server/index.mjs"], { stdio: "inherit", env: process.env }),
  spawn(
    process.execPath,
    ["node_modules/@angular/cli/bin/ng.js", "serve", "--port", process.env.PORT || "4200"],
    {
      stdio: "inherit",
      env: { ...process.env, NG_CLI_ANALYTICS: "false" },
    },
  ),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill("SIGTERM"));
  process.exitCode = code;
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
children.forEach((child) => {
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => stop(code ?? 0));
});
