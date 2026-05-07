/**
 * Stripe API bridge — direct REST calls with secret key auth.
 *
 * Requires: STRIPE_SECRET_KEY env var (sk_test_... or sk_live_...).
 * Uses the Stripe REST API directly — no SDK dependency needed.
 * All responses are JSON. Gracefully returns { error } when key is missing.
 */

const API_BASE = "https://api.stripe.com/v1";

function getKey(): string | null {
  return process.env.STRIPE_SECRET_KEY || null;
}

export async function stripeGet(
  path: string,
  params?: Record<string, string>,
): Promise<unknown> {
  const key = getKey();
  if (!key) return { error: "Set STRIPE_SECRET_KEY env var" };

  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
      const msg = (body as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`;
      console.error(`[stripe] ${path} failed:`, msg);
      return { error: `Stripe API error: ${msg}` };
    }

    return await res.json();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe] Request failed:", msg);
    return { error: `Stripe request failed: ${msg}` };
  }
}
