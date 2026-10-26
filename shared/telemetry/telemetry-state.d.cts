import type { WriteFileOptions } from "node:fs";

export interface TelemetryStateIO {
  homedir(): string;
  readFile(file: string): string;
  writeFile(file: string, contents: string, options?: WriteFileOptions): void;
  mkdir(directory: string): void;
  rename(from: string, to: string): void;
  link(existing: string, target: string): void;
  unlink(file: string): void;
  randomUUID(): string;
}

export interface TelemetryState extends Record<string, unknown> {
  distinctId: string;
}

export type TelemetryStateStatus = "missing" | "readable" | "unreadable";

export interface TelemetryStateContext {
  file: string;
  status: TelemetryStateStatus;
  state: TelemetryState;
  changed: boolean;
}

export function createTelemetryStateIO(overrides?: Partial<TelemetryStateIO>): TelemetryStateIO;

export function loadTelemetryState(options?: {
  env?: Readonly<Record<string, string | undefined>>;
  io?: Partial<TelemetryStateIO>;
}): TelemetryStateContext;

export function saveTelemetryState(
  context: TelemetryStateContext,
  state: TelemetryState,
  io?: Partial<TelemetryStateIO>,
): TelemetryStateContext;
