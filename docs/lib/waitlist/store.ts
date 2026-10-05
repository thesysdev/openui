/* Where a waitlist address actually goes.
 *
 * One function behind one result type, so the route handler never learns which
 * service is on the other end and changing providers is a change to this file
 * alone. Plain fetch, so no new dependency and no build-time coupling.
 *
 * Currently Tally, posting to the endpoint Tally's own form page uses. We call
 * it server side, which is why the form on our page can keep its own design:
 * nothing of Tally's is ever rendered, and no iframe or popup is involved.
 *
 * CAVEATS, worth knowing before debugging this:
 *
 *   - The endpoint is undocumented. Tally's public REST API can list, fetch and
 *     delete submissions but cannot create one, so this is the only way to hand
 *     it an address from our own UI. It is stable in practice; it is not a
 *     contract.
 *   - Tally does NOT validate server side. A wrong TALLY_EMAIL_FIELD still
 *     returns 200 and records an empty submission rather than an error, even
 *     though the question is marked required in the form. That makes the field
 *     id a one-time configuration risk: get it wrong and signups arrive blank
 *     and silent. Verified by a live submission when it was set, and worth
 *     re-verifying if the form is ever rebuilt, since the id changes with it.
 *   - Duplicates are not detected. The same address twice records twice.
 *
 * Unlike a Google Form, Tally answers with JSON carrying a submissionId, so we
 * can require that rather than trusting the status code alone.
 */

/* Upper bound on how long a signup may block the request. */
const TIMEOUT_MS = 8000;

export type WaitlistResult = { ok: true } | { ok: false; reason: "unconfigured" | "upstream" };

export async function addToWaitlist(email: string, signal?: AbortSignal): Promise<WaitlistResult> {
  const formId = process.env.TALLY_FORM_ID?.trim();
  /* The uuid Tally keys the answer by: the question's `groupUuid`, which is also
     the id attribute on the rendered input. Not the block uuid. */
  const field = process.env.TALLY_EMAIL_FIELD?.trim();
  /* Missing config means the address has nowhere to go. Say so, rather than
     returning a success the caller would show to someone whose signup was
     discarded. */
  if (!formId || !field) return { ok: false, reason: "unconfigured" };

  /* Give up rather than hold the request open if Tally stalls. Combined with the
     caller's own signal, so a disconnected client cancels too. */
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(`https://api.tally.so/forms/${formId}/respond`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        /* Some runtimes send no User-Agent by default, which is likelier to be
           rejected. */
        "user-agent": "openui-website-waitlist",
      },
      body: JSON.stringify({
        /* One-shot submission, so the session and respondent are per-request.
           Tally uses these to stitch partial responses together; we never send
           a partial one. */
        sessionUuid: crypto.randomUUID(),
        respondentUuid: crypto.randomUUID(),
        responses: { [field]: email },
        captchas: {},
        isCompleted: true,
        password: null,
      }),
      signal: combined,
    });
  } catch {
    return { ok: false, reason: "upstream" };
  }

  if (!response.ok) return { ok: false, reason: "upstream" };

  /* Require the recorded id rather than trusting the status: a 200 carrying
     anything else means Tally did not record what we think it did. */
  try {
    const body = (await response.json()) as { submissionId?: unknown };
    if (typeof body?.submissionId === "string" && body.submissionId) return { ok: true };
  } catch {
    /* Fall through: a 200 that is not the JSON we expect is not a success. */
  }
  return { ok: false, reason: "upstream" };
}
