import { hasAllowedOrigin, hasJsonContentType } from "@/lib/openui-cloud/request";
import { addToWaitlist } from "@/lib/waitlist/store";

/* Public and unauthenticated. It checks that a request came from this site and
   carries a plausible address, then hands off; volume control is left to Tally,
   which does its own spam handling and is the thing actually being protected.

   The origin helper lives under openui-cloud only because that is where it was
   written; it is generic, and its default allowlist is this site's own origin,
   which is exactly what a same-origin form post needs. */

const MAX_BODY_BYTES = 1024;
/* RFC 5321's cap on a forward path. */
const MAX_EMAIL_LENGTH = 254;

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/* Not a full RFC 5322 parser, and not trying to be. It rejects the obvious
   nonsense so the provider is not called for it; the provider stays the
   authority on whether an address is real. */
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export async function POST(request: Request): Promise<Response> {
  if (!hasAllowedOrigin(request)) return json({ error: "Forbidden" }, 403);
  if (!hasJsonContentType(request)) return json({ error: "Expected application/json" }, 415);

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return json({ error: "Body too large" }, 413);

  let payload: { email?: unknown };
  try {
    payload = (await request.json()) as { email?: unknown };
  } catch {
    return json({ error: "Malformed JSON" }, 400);
  }

  if (typeof payload?.email !== "string") return json({ error: "Email is required" }, 400);
  const email = payload.email.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL.test(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }

  const result = await addToWaitlist(email, request.signal);
  if (result.ok) return json({ ok: true }, 200);

  /* Both remaining outcomes are the server's problem, not the visitor's, and
     neither may be reported as success: a silently dropped signup is invisible
     to the person signing up and to us. */
  if (result.reason === "unconfigured") {
    console.error(
      "[waitlist] TALLY_FORM_ID / TALLY_EMAIL_FIELD are not set; the signup was not stored.",
    );
  }
  return json({ error: "Could not save that right now. Please try again." }, 503);
}
