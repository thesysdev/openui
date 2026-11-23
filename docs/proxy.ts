import { createDemosPausedResponse, DEMOS_DISABLED, isProxiedDemoSlug } from "@/lib/demos-offline";
import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";

const { rewrite: rewriteLLM } = rewritePath("/docs{/*path}", "/llms.mdx/docs{/*path}");

// IndexNow checks site ownership by fetching /<key>.txt. The key lives in an env var, not in the
// repo, so only this site and the search engines know it.
const indexNowKey = process.env.INDEXNOW_KEY;

/** While the hosted demos are offline, stop every request that would spend credits. */
function pausedDemoResponse(request: NextRequest): NextResponse | Response | undefined {
  // /demo/<slug>/... for the demos proxied from their own Vercel projects.
  const [, section, slug, ...rest] = request.nextUrl.pathname.split("/");
  if (section !== "demo" || !slug || !isProxiedDemoSlug(slug)) return undefined;
  if (rest[0] === "api") return createDemosPausedResponse();
  // Leave build assets alone; every page shows the notice, at the same URL.
  if (rest[0] === "_next") return undefined;
  return NextResponse.rewrite(new URL(`/demo-unavailable/${slug}`, request.nextUrl));
}

export default function proxy(request: NextRequest) {
  if (indexNowKey && request.nextUrl.pathname === `/${indexNowKey}.txt`) {
    return new Response(indexNowKey, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  if (DEMOS_DISABLED) {
    const paused = pausedDemoResponse(request);
    if (paused) return paused;
  }

  if (isMarkdownPreferred(request)) {
    const markdownPath = rewriteLLM(request.nextUrl.pathname);

    if (markdownPath) {
      return NextResponse.rewrite(new URL(markdownPath, request.nextUrl));
    }
  }

  return NextResponse.next();
}
