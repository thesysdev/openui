import { spawn } from "node:child_process";
import * as path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { context } from "../context";
import { detectAgent, UNKNOWN_AGENT_NAME } from "../detect-agent";
import { CreateError } from "../errors";
import {
  clearPendingLogin,
  isProcessAlive,
  loadSession,
  readPendingLogin,
  type PendingLogin,
  type SavedSession,
} from "./session";

// Compiled layout: dist/lib/auth/background.js → dist/index.js
const CLI_ENTRY = path.resolve(__dirname, "..", "..", "index.js");
const URL_READY_TIMEOUT_MS = 15_000;
// Stays well under typical agent shell-tool timeouts (Claude Code defaults to 2 min).
const WAIT_FOR_SIGN_IN_MS = 60_000;

/** Exit code while sign-in is still pending (EX_TEMPFAIL): re-run the same command. */
export const SIGN_IN_PENDING_EXIT_CODE = 75;

/**
 * Whether this process can hold the terminal open while the user signs in.
 * Coding agents and non-TTY runs can't: their shell tools time out or only show
 * output after exit, so they get the background flow instead.
 */
export const canSignInInline = () =>
  Boolean(process.stdin.isTTY && process.stdout.isTTY) && detectAgent() === UNKNOWN_AGENT_NAME;

const authError = (code: string, message: string) =>
  new CreateError("cloud_auth", message, "authentication", code);

/** The user hasn't finished signing in yet; carries the link to show them. */
export class SignInPendingError extends CreateError {
  constructor(
    public readonly url: string,
    nextStep: string,
  ) {
    super(
      "cloud_auth",
      `Sign-in required. Open this link to sign in to Thesys:\n  ${url}\n` +
        `Then ${nextStep}; it waits for the sign-in to finish.`,
      "authentication",
      "SIGN_IN_PENDING",
      { auth_failure_stage: "browser_auth" },
    );
    this.name = "SignInPendingError";
  }
}

/** The background sign-in still in progress, if any. Throws (once) if it failed. */
function runningLogin(): (PendingLogin & { url: string }) | null {
  const login = readPendingLogin();
  if (!login) return null;
  if (login.status === "failed") {
    clearPendingLogin();
    throw authError(
      "SIGN_IN_FAILED",
      `Sign-in failed: ${login.error}. Re-run the command to try again.`,
    );
  }
  if (login.url && login.expiresAt > Date.now() && isProcessAlive(login.pid)) {
    return { ...login, url: login.url };
  }
  clearPendingLogin(); // expired or the process died: start over
  return null;
}

/**
 * Start a detached `openui auth login` that runs the normal browser sign-in and
 * saves the session when it completes. Resolves once the sign-in URL is known.
 */
async function startBackgroundLogin(): Promise<string> {
  const child = spawn(process.execPath, [CLI_ENTRY, "auth", "login", "--background-child"], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: context.telemetry.enabled
      ? process.env
      : { ...process.env, OPENUI_TELEMETRY_DISABLED: "1" },
  });
  child.unref();

  const deadline = Date.now() + URL_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const login = readPendingLogin();
    if (login && login.pid === child.pid) {
      if (login.status === "failed") {
        clearPendingLogin();
        throw authError("SIGN_IN_START_FAILED", `Could not start sign-in: ${login.error}`);
      }
      if (login.url) return login.url;
    }
    await sleep(200);
  }
  throw authError("SIGN_IN_START_TIMEOUT", "Timed out starting the browser sign-in.");
}

/**
 * Sign in without holding the terminal for long. The first call starts a
 * background sign-in and throws SignInPendingError with the link; re-running
 * the command waits (bounded) for that sign-in and resolves with the session.
 */
export async function signInInBackground(nextStep: string): Promise<SavedSession> {
  const running = runningLogin();
  if (!running) throw new SignInPendingError(await startBackgroundLogin(), nextStep);

  const deadline = Date.now() + WAIT_FOR_SIGN_IN_MS;
  while (Date.now() < deadline) {
    const session = loadSession();
    if (session) return session;
    if (!runningLogin()) {
      // The child saves the session before clearing its status file; re-check to close that gap.
      const finished = loadSession();
      if (finished) return finished;
      throw authError("SIGN_IN_EXPIRED", "Sign-in expired. Re-run the command for a new link.");
    }
    await sleep(1000);
  }
  throw new SignInPendingError(running.url, nextStep);
}
