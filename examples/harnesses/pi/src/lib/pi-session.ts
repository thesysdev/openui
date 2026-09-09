/**
 * Server-only registry of Pi `AgentSession`s, one per chat thread.
 *
 * The OpenUI frontend is stateless per request (it re-sends the whole thread
 * each turn), but the Pi SDK keeps its own transcript and only wants the newest
 * user turn via `session.prompt(text)`. So we key a persistent `AgentSession`
 * by the frontend's per-thread conversation id and reuse it across turns to
 * preserve context.
 *
 * The SDK is an ESM-only package (its `exports` map has no `require` entry), so
 * it is loaded with a native dynamic `import()`. next.config.ts marks
 * `@earendil-works/pi-coding-agent` as a webpack external so this stays a real
 * runtime import instead of being bundled (bundling breaks its dynamic
 * requires, `import.meta`, and on-disk prompt/skill/theme reads).
 */
import type { AgentSession } from "@earendil-works/pi-coding-agent";
import { join } from "node:path";
import { cloudInstructions } from "./cloud-prompt";

type PiSdk = typeof import("@earendil-works/pi-coding-agent");

const DEFAULT_MODEL = "google/gemini-3.6-flash-free";
const MODELS_PATH = join(process.cwd(), "src/lib/openui-cloud-models.json");
const OPENUI_INSTRUCTIONS = `You are a coding agent connected to OpenUI. Use reasoning and tools normally before answering.
Do not emit OpenUI Lang in reasoning, progress messages, tool arguments, or tool results.
After all required work is complete, your final assistant response must consist entirely of valid openui-lang code with no markdown or explanatory prose.
Before sending the final response, verify that root is a Stack and every referenced identifier is defined.`;

let sdkPromise: Promise<PiSdk> | undefined;
function loadSdk(): Promise<PiSdk> {
  if (!sdkPromise) {
    // Only cache a *successful* load. Caching a rejected promise would brick the
    // route forever after one transient import failure (e.g. a sibling package
    // not yet built); clear it on failure so the next request retries.
    sdkPromise = import("@earendil-works/pi-coding-agent").catch((err) => {
      sdkPromise = undefined;
      throw err;
    });
  }
  return sdkPromise;
}

export interface PiSessionEntry {
  session: AgentSession;
  lastUsed: number;
  /** Set when no model/auth could be resolved; surfaced to the user. */
  modelFallbackMessage?: string;
}

interface GetOrCreateOptions {
  /** Workspace the coding agent operates in. */
  cwd: string;
}

const IDLE_TTL_MS = 30 * 60 * 1000; // evict sessions idle for 30 min
const MAX_SESSIONS = 50;

// Pin the registry to globalThis so Next dev hot-reload (which re-evaluates this
// module) doesn't orphan live sessions or silently drop pi's transcript.
const globalStore = globalThis as unknown as {
  __piWebSessions?: Map<string, PiSessionEntry>;
  __piWebCreating?: Map<string, Promise<PiSessionEntry>>;
};
const SESSIONS = (globalStore.__piWebSessions ??= new Map<string, PiSessionEntry>());
const CREATING = (globalStore.__piWebCreating ??= new Map<string, Promise<PiSessionEntry>>());

function evictIdle(now: number): void {
  for (const [id, entry] of SESSIONS) {
    // Never tear down a session that is mid-turn for an in-flight request.
    if (now - entry.lastUsed > IDLE_TTL_MS && !entry.session.isStreaming) {
      entry.session.dispose();
      SESSIONS.delete(id);
    }
  }
}

function evictOldestIfFull(): void {
  if (SESSIONS.size < MAX_SESSIONS) return;
  let oldestId: string | undefined;
  let oldest = Number.POSITIVE_INFINITY;
  for (const [id, entry] of SESSIONS) {
    if (entry.session.isStreaming) continue; // never evict an active turn
    if (entry.lastUsed < oldest) {
      oldest = entry.lastUsed;
      oldestId = id;
    }
  }
  if (oldestId) {
    SESSIONS.get(oldestId)?.session.dispose();
    SESSIONS.delete(oldestId);
  }
}

/**
 * Full coding agent (read/bash/edit/write) by default — matching the local-tool
 * intent. Set PI_WEB_TOOLS=read-only to restrict to non-mutating tools (sensible
 * for any networked/multi-user exposure).
 */
function toolOptions(): { tools?: string[] } {
  if ((process.env.PI_WEB_TOOLS ?? "").toLowerCase() === "read-only") {
    return { tools: ["read"] };
  }
  return {};
}

async function createSession(cwd: string): Promise<PiSessionEntry> {
  const apiKey = process.env.THESYS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing required env var: THESYS_API_KEY");
  }

  const {
    AuthStorage,
    createAgentSession,
    DefaultResourceLoader,
    getAgentDir,
    ModelRegistry,
    SettingsManager,
  } = await loadSdk();

  evictOldestIfFull();

  const agentDir = getAgentDir();
  const settingsManager = SettingsManager.create(cwd, agentDir);
  const authStorage = AuthStorage.inMemory();
  authStorage.setRuntimeApiKey("openui-cloud", apiKey);
  const modelRegistry = ModelRegistry.create(authStorage, MODELS_PATH);
  const modelId = process.env.OPENUI_MODEL?.trim() || DEFAULT_MODEL;
  const model = modelRegistry.find("openui-cloud", modelId);
  if (!model) {
    throw new Error(
      `OpenUI Cloud model "${modelId}" is not in src/lib/openui-cloud-models.json`,
    );
  }

  // Extra coding-agent rules are preserved as customer instructions after the
  // Cloud config block built from the generated openuiLibrary spec.
  const resourceLoader = new DefaultResourceLoader({
    cwd,
    agentDir,
    settingsManager,
    appendSystemPrompt: [cloudInstructions(OPENUI_INSTRUCTIONS)],
  });
  await resourceLoader.reload();

  const { session, modelFallbackMessage } = await createAgentSession({
    cwd,
    agentDir,
    settingsManager,
    resourceLoader,
    authStorage,
    modelRegistry,
    model,
    ...toolOptions(),
  });

  return { session, lastUsed: Date.now(), modelFallbackMessage };
}

export async function getOrCreateSession(
  conversationId: string,
  { cwd }: GetOrCreateOptions,
): Promise<PiSessionEntry> {
  const now = Date.now();
  evictIdle(now);

  const existing = SESSIONS.get(conversationId);
  if (existing) {
    existing.lastUsed = now;
    return existing;
  }

  // De-duplicate concurrent first-creates for the same conversation so two
  // requests can't each build a session and leak the loser.
  const inFlight = CREATING.get(conversationId);
  if (inFlight) return inFlight;

  const creation = createSession(cwd)
    .then((entry) => {
      SESSIONS.set(conversationId, entry);
      return entry;
    })
    .finally(() => {
      CREATING.delete(conversationId);
    });
  CREATING.set(conversationId, creation);
  return creation;
}

export function abortSession(conversationId: string): void {
  void SESSIONS.get(conversationId)?.session.abort();
}
