import * as fs from "node:fs";
import * as path from "node:path";

import { configDir } from "../config-dir";

/** A signed-in Thesys session: enough to mint org API keys without the browser. */
export interface SavedSession {
  accessToken: string;
  orgId: string;
  sub?: string;
  /** Epoch ms. */
  expiresAt: number;
}

/** Status file written by a background `openui auth login` while it waits for the browser. */
export interface PendingLogin {
  status: "pending" | "failed";
  pid: number;
  url?: string;
  error?: string;
  /** Epoch ms. */
  expiresAt: number;
}

// Treat a token this close to expiry as expired so a mint never races the deadline.
const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

const sessionFile = () => path.join(configDir(), "session.json");
const loginFile = () => path.join(configDir(), "login.json");

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  // Write-then-rename so a concurrent reader never sees a half-written file.
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value), { mode: 0o600 });
  fs.renameSync(tmp, file);
}

const remove = (file: string) => fs.rmSync(file, { force: true });

export function loadSession(): SavedSession | null {
  const s = readJson<SavedSession>(sessionFile());
  if (!s?.accessToken || !s.orgId || !(s.expiresAt - EXPIRY_MARGIN_MS > Date.now())) return null;
  return s;
}

export function saveSession(session: SavedSession): void {
  try {
    writeJson(sessionFile(), session);
  } catch {
    /* read-only fs: the session just isn't reused next time */
  }
}

export const clearSession = () => remove(sessionFile());

export const readPendingLogin = () => readJson<PendingLogin>(loginFile());
export const writePendingLogin = (login: PendingLogin) => writeJson(loginFile(), login);
export const clearPendingLogin = () => remove(loginFile());

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}
