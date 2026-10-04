import http from "node:http";

// openid-client's Configuration type is ESM-only; keep it opaque in this CJS build.
type Configuration = any;

export interface AuthConfig {
  issuerUrl: string;
  clientId: string;
  redirectUri?: string;
  scopes?: string[];
}

export interface AuthResult {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  userInfo?: Record<string, unknown>;
}

const SUCCESS_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Signed in</title><style>:root{--bg:oklch(0.97 0 89.876);--card:oklch(1 0 89.876);--fg:oklch(0 0 0);--fg2:oklch(0 0 0/.5);--line:oklch(0 0 0/.06);--shadow:0 4px 6px -2px oklch(0 0 0/.025),0 2px 2px -2px oklch(0 0 0/.05)}@media(prefers-color-scheme:dark){:root{--bg:#0b0b0f;--card:oklch(0.269 0 89.876);--fg:oklch(1 0 89.876);--fg2:oklch(1 0 89.876/.5);--line:oklch(1 0 89.876/.12);--shadow:0 4px 10px oklch(0 0 0/.5)}}*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;background:var(--bg);color:var(--fg);font-family:"Inter","Segoe UI",system-ui,Arial,sans-serif;-webkit-font-smoothing:antialiased}.card{width:100%;max-width:400px;background:var(--card);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);padding:32px;text-align:center}.mark{width:48px;height:48px;margin:0 auto 20px;border-radius:999px;display:grid;place-items:center}.mark svg{width:24px;height:24px;stroke-width:2.25;fill:none;stroke-linecap:round;stroke-linejoin:round}h1{margin:0 0 6px;font-size:19px;font-weight:600;letter-spacing:-.01em}p{margin:0;font-size:14px;line-height:1.55;color:var(--fg2)}.detail{margin-top:16px;padding:10px 12px;background:var(--bg);border:1px solid var(--line);border-radius:8px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--fg2);text-align:left;word-break:break-word}.next{margin-top:18px;padding-top:16px;border-top:1px solid var(--line);font-size:13px;color:var(--fg2)}code{font:12px ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--bg);border:1px solid var(--line);border-radius:4px;padding:1px 5px;color:var(--fg)}.mark{background:oklch(0.627 0.17 149.214/.10)}.mark svg{stroke:oklch(0.627 0.17 149.214)}@media(prefers-color-scheme:dark){.mark{background:oklch(0.627 0.17 149.214/.18)}}</style></head><body><main class="card"><div class="mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div><h1>Signed in</h1><p>Your OpenUI Cloud API key has been created.</p><div class="next">You can close this tab and return to your terminal.</div></main></body></html>`;

const errorHtml = (msg: string) =>
  `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign-in failed</title><style>:root{--bg:oklch(0.97 0 89.876);--card:oklch(1 0 89.876);--fg:oklch(0 0 0);--fg2:oklch(0 0 0/.5);--line:oklch(0 0 0/.06);--shadow:0 4px 6px -2px oklch(0 0 0/.025),0 2px 2px -2px oklch(0 0 0/.05)}@media(prefers-color-scheme:dark){:root{--bg:#0b0b0f;--card:oklch(0.269 0 89.876);--fg:oklch(1 0 89.876);--fg2:oklch(1 0 89.876/.5);--line:oklch(1 0 89.876/.12);--shadow:0 4px 10px oklch(0 0 0/.5)}}*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;background:var(--bg);color:var(--fg);font-family:"Inter","Segoe UI",system-ui,Arial,sans-serif;-webkit-font-smoothing:antialiased}.card{width:100%;max-width:400px;background:var(--card);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);padding:32px;text-align:center}.mark{width:48px;height:48px;margin:0 auto 20px;border-radius:999px;display:grid;place-items:center}.mark svg{width:24px;height:24px;stroke-width:2.25;fill:none;stroke-linecap:round;stroke-linejoin:round}h1{margin:0 0 6px;font-size:19px;font-weight:600;letter-spacing:-.01em}p{margin:0;font-size:14px;line-height:1.55;color:var(--fg2)}.detail{margin-top:16px;padding:10px 12px;background:var(--bg);border:1px solid var(--line);border-radius:8px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--fg2);text-align:left;word-break:break-word}.next{margin-top:18px;padding-top:16px;border-top:1px solid var(--line);font-size:13px;color:var(--fg2)}code{font:12px ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--bg);border:1px solid var(--line);border-radius:4px;padding:1px 5px;color:var(--fg)}.mark{background:oklch(0.577 0.215 27.325/.10)}.mark svg{stroke:oklch(0.577 0.215 27.325)}@media(prefers-color-scheme:dark){.mark{background:oklch(0.577 0.215 27.325/.18)}}</style></head><body><main class="card"><div class="mark"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5h.01"/></svg></div><h1>Sign-in failed</h1><p>Your key was not created.</p><div class="detail">${msg}</div><div class="next">Return to your terminal and run <code>openui create</code> again.</div></main></body></html>`;

/** OAuth 2.0 + PKCE via a local loopback callback. ESM-only deps load via dynamic import(). */
export class Authenticator {
  private readonly config: AuthConfig & { redirectUri: string; scopes: string[] };
  private clientConfig?: Configuration;
  private codeVerifier?: string;

  constructor(config: AuthConfig) {
    this.config = {
      redirectUri: "http://localhost:0/cb", // 0 = any free port
      scopes: ["openid", "profile", "email"],
      ...config,
    };
  }

  getClientConfig(): Configuration {
    if (!this.clientConfig) {
      throw new Error("Client not initialized. Call initialize() first.");
    }
    return this.clientConfig;
  }

  async initialize(): Promise<void> {
    const { discovery } = await import("openid-client");
    this.clientConfig = await discovery(new URL(this.config.issuerUrl), this.config.clientId);
  }

  async authenticate(): Promise<AuthResult> {
    if (!this.clientConfig) {
      throw new Error("Client not initialized. Call initialize() first.");
    }
    const { randomPKCECodeVerifier, calculatePKCECodeChallenge } = await import("openid-client");
    this.codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(this.codeVerifier);
    return this.handleBrowserAuth(codeChallenge);
  }

  private async handleBrowserAuth(codeChallenge: string): Promise<AuthResult> {
    const { authorizationCodeGrant, buildAuthorizationUrl } = await import("openid-client");
    const { default: open } = await import("open");

    return new Promise<AuthResult>((resolve, reject) => {
      let settled = false;
      let actualPort = 0;
      let timerId: null | NodeJS.Timeout = null;
      const finish = (run: () => void) => {
        if (settled) return;
        settled = true;
        if (timerId) clearTimeout(timerId);
        server.close();
        run();
      };

      const server = http.createServer(async (req, res) => {
        if (!req.url?.startsWith("/cb")) {
          res.writeHead(404, { Connection: "close" });
          res.end("Not found");
          return;
        }
        try {
          const callbackUrl = new URL(req.url, `http://localhost:${actualPort}`);
          if (!this.clientConfig || !this.codeVerifier) {
            throw new Error("Client not properly initialized");
          }
          const tokens = await authorizationCodeGrant(this.clientConfig, callbackUrl, {
            pkceCodeVerifier: this.codeVerifier,
          });
          let userInfo: Record<string, unknown> | undefined;
          try {
            const claims = tokens.claims();
            if (claims) userInfo = claims as Record<string, unknown>;
          } catch {
            /* no id_token claims */
          }
          res.writeHead(200, { "Content-Type": "text/html", Connection: "close" });
          res.end(SUCCESS_HTML);
          finish(() =>
            resolve({
              accessToken: tokens.access_token ?? "",
              refreshToken: tokens.refresh_token,
              idToken: tokens.id_token,
              userInfo,
            }),
          );
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          res.writeHead(200, { "Content-Type": "text/html", Connection: "close" });
          res.end(errorHtml(msg));
          finish(() => reject(new Error(`Token exchange failed: ${msg}`)));
        }
      });

      server.on("error", (error) => finish(() => reject(error)));

      server.listen(0, async () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          finish(() => reject(new Error("Failed to bind a local callback port.")));
          return;
        }
        actualPort = address.port;
        const url = buildAuthorizationUrl(this.clientConfig!, {
          redirect_uri: `http://localhost:${actualPort}/cb`,
          scope: this.config.scopes.join(" "),
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
        }).toString();

        console.info("\n🌐 Opening your browser to sign in to Thesys…");
        console.info(`   If it doesn't open, visit:\n   ${url}\n`);
        try {
          await open(url);
        } catch {
          /* user opens the URL manually */
        }
        console.info("⏳ Waiting for you to finish signing in…");
      });

      timerId = setTimeout(
        () => finish(() => reject(new Error("Sign-in timed out after 5 minutes."))),
        5 * 60 * 1000,
      );
    });
  }
}
