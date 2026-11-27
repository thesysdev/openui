/** One request as the fake fetch saw it. */
export interface SentRequest {
  method: string;
  url: URL;
  headers: Record<string, string>;
  /** The parsed JSON body, if there was one. */
  body: unknown;
}

/** A fetch that records each request and answers with `reply`. */
export function fakeFetch(
  reply: (request: SentRequest) => Response | Promise<Response> = () => json({}),
) {
  const requests: SentRequest[] = [];
  const fetch: typeof globalThis.fetch = async (input, init = {}) => {
    const request: SentRequest = {
      method: init.method ?? "GET",
      url: new URL(String(input)),
      headers: { ...(init.headers as Record<string, string>) },
      body: init.body === undefined ? undefined : JSON.parse(String(init.body)),
    };
    requests.push(request);
    return reply(request);
  };
  return { fetch, requests };
}

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

/** The error `fn` throws or rejects with. */
export async function caught(fn: () => unknown): Promise<unknown> {
  try {
    await fn();
  } catch (error) {
    return error;
  }
  throw new Error("expected an error");
}
