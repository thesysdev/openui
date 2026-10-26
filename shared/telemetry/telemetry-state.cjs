"use strict";

// Shared by Lang Core's installation telemetry and the OpenUI CLI so both read and write
// the telemetry state file the same way.
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function createTelemetryStateIO(overrides = {}) {
  return {
    homedir: os.homedir,
    readFile: (file) => fs.readFileSync(file, "utf8"),
    writeFile: (file, contents, options) => fs.writeFileSync(file, contents, options),
    mkdir: (directory) => fs.mkdirSync(directory, { recursive: true, mode: 0o700 }),
    rename: fs.renameSync,
    link: fs.linkSync,
    unlink: fs.unlinkSync,
    randomUUID: crypto.randomUUID,
    ...overrides,
  };
}

function getTelemetryStateFile(env, io) {
  const configRoot = env["XDG_CONFIG_HOME"] || path.join(io.homedir(), ".config");
  return path.join(configRoot, "openui", "telemetry.json");
}

function readStoredState(file, io) {
  let contents;
  try {
    contents = io.readFile(file);
  } catch (error) {
    // State that exists but cannot be read is left untouched.
    return { stored: {}, status: hasErrorCode(error, "ENOENT") ? "missing" : "unreadable" };
  }

  try {
    const parsed = JSON.parse(contents);
    return { stored: isRecord(parsed) ? parsed : {}, status: "readable" };
  } catch {
    // Corrupt state is replaced with a new best-effort state.
    return { stored: {}, status: "readable" };
  }
}

function getStoredDistinctId(stored) {
  const distinctId = stored["distinctId"];
  return typeof distinctId === "string" && distinctId ? distinctId : undefined;
}

function loadTelemetryState(options = {}) {
  const env = options.env ?? process.env;
  const io = createTelemetryStateIO(options.io);
  const file = getTelemetryStateFile(env, io);
  const { stored, status } = readStoredState(file, io);
  const storedDistinctId = getStoredDistinctId(stored);

  return {
    file,
    status,
    state: { ...stored, distinctId: storedDistinctId ?? io.randomUUID() },
    // Only a newly created identity needs to be written back.
    changed: !storedDistinctId,
  };
}

/**
 * Writes the state without exposing partial files to concurrent processes. New state is published
 * only if no other process created it first; otherwise that process's identity is reused.
 */
function saveTelemetryState(context, state, overrides) {
  if (context.status === "unreadable") return { ...context, state, changed: false };

  const io = createTelemetryStateIO(overrides);
  const contents = JSON.stringify(state);
  const temporaryFile = `${context.file}.${io.randomUUID()}.tmp`;
  const saved = (savedState) => ({
    ...context,
    status: "readable",
    state: savedState,
    changed: false,
  });

  try {
    io.mkdir(path.dirname(context.file));
    io.writeFile(temporaryFile, contents, { mode: 0o600, flag: "wx" });

    if (context.status === "readable") {
      io.rename(temporaryFile, context.file);
      return saved(state);
    }

    try {
      io.link(temporaryFile, context.file);
      return saved(state);
    } catch (error) {
      if (!hasErrorCode(error, "EEXIST")) {
        // Filesystems without hard links still get a create-only write.
        try {
          io.writeFile(context.file, contents, { mode: 0o600, flag: "wx" });
          return saved(state);
        } catch (fallbackError) {
          if (!hasErrorCode(fallbackError, "EEXIST")) throw fallbackError;
        }
      }
    }

    const winner = readStoredState(context.file, io).stored;
    const winnerDistinctId = getStoredDistinctId(winner);
    return winnerDistinctId ? saved({ ...winner, distinctId: winnerDistinctId }) : saved(state);
  } catch {
    // Read-only or ephemeral environments use the in-memory state for this run.
    return { ...context, state, changed: false };
  } finally {
    try {
      io.unlink(temporaryFile);
    } catch {
      // The temporary file was renamed into place or never created.
    }
  }
}

function hasErrorCode(error, code) {
  return isRecord(error) && error["code"] === code;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

module.exports = { createTelemetryStateIO, loadTelemetryState, saveTelemetryState };
