const UTM_PARAMS = {
  utm_source: "openui",
  utm_medium: "referral",
  utm_campaign: "openui_devtools",
} as const;

/** Tags an outbound devtools link so referrals are attributable, keeping existing params. */
export function withDevtoolsAttribution(href: string, content: string) {
  let url: URL;

  try {
    url = new URL(href);
  } catch {
    return href;
  }

  for (const [key, value] of Object.entries(UTM_PARAMS)) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }

  if (!url.searchParams.has("utm_content")) url.searchParams.set("utm_content", content);

  return url.toString();
}
