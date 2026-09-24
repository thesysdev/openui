import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { customerValues } from "./store";

// Screens the LLM wrote earlier. A JSON file is enough for a demo.
export interface Screen {
  id: string;
  title: string;
  /** What the screen does plus example requests; Jev matches new requests against it. */
  description: string;
  program: string;
  writtenFor: string;
  needsItem: boolean;
  uses: number;
}

const FILE = ".data/screens.json";

export function loadScreens(): Screen[] {
  return existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf-8")) : [];
}

function write(screens: Screen[]) {
  mkdirSync(".data", { recursive: true });
  writeFileSync(FILE, JSON.stringify(screens, null, 2));
}

export function clearScreens() {
  write([]);
}

export function addScreen(screen: Omit<Screen, "id" | "uses">): Screen {
  const screens = loadScreens();
  const saved = { ...screen, id: `s${screens.length + 1}`, uses: 0 };
  write([...screens, saved]);
  return saved;
}

export function markUsed(id: string) {
  const screens = loadScreens();
  const screen = screens.find((s) => s.id === id);
  if (screen) screen.uses += 1;
  write(screens);
}

/** Returns why a screen cannot serve other customers, or null if it can. */
export function whyNotReusable(program: string): string | null {
  if (!program.includes("Query(")) return "it has no live data";
  const leaked = customerValues().find((value) => program.includes(value));
  return leaked ? `it hardcodes "${leaked}"` : null;
}
