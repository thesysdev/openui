import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { CreateError } from "./telemetry";

const GIT_TIMEOUT_MS = 60_000;
const FETCH_TIMEOUT_MS = 30_000;

const SOURCE_OWNER = "thesysdev";
const SOURCE_REPO = "openui";
const SOURCE_REF = "main";
const SOURCE_GIT_URL = `https://github.com/${SOURCE_OWNER}/${SOURCE_REPO}.git`;

export type SourceFetchOptions = {
  dest?: string;
};

export type FetchedFile = {
  content: string;
};

export type CheckedOutSource = {
  dir: string;
};

function posixRepoPath(repoPath: string): string {
  return repoPath.replace(/\\/g, "/").replace(/^\/+/, "");
}

function runGit(
  args: string[],
  options: { cwd?: string; timeoutMs?: number } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(
        new CreateError(
          "source_checkout",
          `git ${args[0]} timed out.`,
          "network",
          "CHECKOUT_FAILED",
        ),
      );
    }, options.timeoutMs ?? GIT_TIMEOUT_MS);
    timeout.unref();
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.once("error", (error: NodeJS.ErrnoException) => {
      clearTimeout(timeout);
      if (error.code === "ENOENT") {
        reject(
          new CreateError(
            "source_checkout",
            "git is not installed or not found in PATH.",
            "process",
            "GIT_MISSING",
          ),
        );
        return;
      }
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      const detail = stderr.trim().split("\n").at(-1) ?? `exit ${code}`;
      reject(
        new CreateError(
          "source_checkout",
          `git ${args[0]} failed: ${detail}`,
          "network",
          "CHECKOUT_FAILED",
        ),
      );
    });
  });
}

export async function fetchSourceFile(repoPath: string): Promise<FetchedFile> {
  const normalizedPath = posixRepoPath(repoPath);
  const url = `https://raw.githubusercontent.com/${SOURCE_OWNER}/${SOURCE_REPO}/${SOURCE_REF}/${normalizedPath}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: "text/plain" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new CreateError(
        "source_checkout",
        `Failed to fetch ${normalizedPath} (${response.status}).`,
        "network",
        response.status === 404 ? "SOURCE_MISSING" : "CHECKOUT_FAILED",
      );
    }
    return { content: await response.text() };
  } catch (error) {
    if (error instanceof CreateError) throw error;
    const aborted = error instanceof Error && error.name === "AbortError";
    throw new CreateError(
      "source_checkout",
      aborted ? `Timed out fetching ${normalizedPath}.` : `Failed to fetch ${normalizedPath}.`,
      "network",
      "CHECKOUT_FAILED",
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function checkoutSource(
  repoPath: string,
  opts: SourceFetchOptions = {},
): Promise<CheckedOutSource> {
  const normalizedPath = posixRepoPath(repoPath);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "openui-src-"));
  try {
    await runGit(["init", "--quiet"], { cwd: tmpDir });
    await runGit(["remote", "add", "origin", SOURCE_GIT_URL], { cwd: tmpDir });
    await runGit(["fetch", "--depth", "1", "--filter=blob:none", "origin", SOURCE_REF], {
      cwd: tmpDir,
    });
    await runGit(["sparse-checkout", "set", "--cone", normalizedPath], { cwd: tmpDir });
    await runGit(["checkout", "--quiet", "FETCH_HEAD"], { cwd: tmpDir });

    const extracted = path.join(tmpDir, ...normalizedPath.split("/"));
    if (!fs.existsSync(extracted)) {
      throw new CreateError(
        "source_checkout",
        `Path "${normalizedPath}" was not in ${SOURCE_OWNER}/${SOURCE_REPO}@${SOURCE_REF}.`,
        "filesystem",
        "SOURCE_MISSING",
      );
    }

    const dest = opts.dest ?? fs.mkdtempSync(path.join(os.tmpdir(), "openui-src-"));
    copyDir(extracted, dest);
    return { dir: dest };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function copyDir(from: string, to: string) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}
