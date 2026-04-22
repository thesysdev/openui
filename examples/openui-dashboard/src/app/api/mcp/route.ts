/**
 * Proxies MCP (Streamable HTTP) to Linear's hosted server.
 * Adds Authorization: Bearer from LINEAR_API_KEY / LINEAR_TOKEN / LINEAR_OAUTH_TOKEN
 * so the token never ships to the browser.
 *
 * @see https://linear.app/docs/mcp
 */
import { LINEAR_MCP_URL, getLinearBearerToken } from "@/lib/linear-mcp";

const HOP_BY_HOP = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function forwardRequestHeaders(req: Request, bearer: string): Headers {
  const out = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) out.append(key, value);
  });
  out.set("Authorization", `Bearer ${bearer}`);
  return out;
}

async function proxyToLinear(req: Request): Promise<Response> {
  const token = getLinearBearerToken();
  if (!token) {
    return new Response(
      JSON.stringify({
        error: "Set LINEAR_API_KEY (or LINEAR_TOKEN / LINEAR_OAUTH_TOKEN) to use Linear MCP.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const headers = forwardRequestHeaders(req, token);
  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
  };
  if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
    init.body = req.body;
    init.duplex = "half";
  }

  return fetch(LINEAR_MCP_URL, init);
}

export async function POST(req: Request) {
  return proxyToLinear(req);
}

export async function GET(req: Request) {
  return proxyToLinear(req);
}

export async function DELETE(req: Request) {
  return proxyToLinear(req);
}
