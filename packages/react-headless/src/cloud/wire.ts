/**
 * Wire types for the OpenUI Cloud /v1 API, plus the shared list envelope,
 * cursor rule, and request helper. Field-for-field mirrors of the API DTOs.
 */

/** A conversation. `created_at` is unix SECONDS. */
export interface CloudConversation {
  id: string;
  object: "conversation";
  created_at: number;
  title?: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
  app_id?: string;
}

/** A conversation item (full Responses item shape). */
export interface CloudConversationItem {
  id: string;
  object: "conversation.item";
  type: string; // message | function_call | function_call_output | ...
  role?: string;
  status?: string;
  content?: unknown;
  metadata?: Record<string, unknown>;
  created_at: number;
  call_id?: string;
  name?: string;
  arguments?: string;
  output?: unknown;
}

/** A stored artifact. `content` is the renderer-ready openui-lang program. */
export interface CloudArtifact {
  id: string;
  object: "openui.artifact";
  conversation_id: string;
  kind: string; // 'slides' | 'report'
  name?: string;
  version?: string; // server bumps via String(Date.now()) when omitted
  content: string;
  created_at: number;
  updated_at?: number;
}

/** List envelope shared by all paged endpoints. */
export interface CloudListEnvelope<T> {
  object: "list";
  data: T[];
  has_more: boolean;
  first_id?: string;
  last_id?: string;
}

/** Forward cursor: pass `last_id` back as `?after=` when there's another page. */
export function nextCursorOf(envelope: CloudListEnvelope<unknown>): string | undefined {
  return envelope.has_more && envelope.last_id ? envelope.last_id : undefined;
}

/**
 * Request helper: prefix baseUrl, set JSON content-type only when sending a
 * body, throw on non-2xx. `fetchImpl` is the token-injecting fetch — auth
 * lives there, never here.
 */
export function cloudRequest(fetchImpl: typeof fetch, baseUrl: string) {
  const base = baseUrl.replace(/\/+$/, "");
  return async (path: string, init?: RequestInit): Promise<Response> => {
    const res = await fetchImpl(`${base}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(
        `OpenUI Cloud: ${init?.method ?? "GET"} ${path} failed: ${res.status} ${res.statusText}`,
      );
    }
    return res;
  };
}
