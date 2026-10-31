/**
 * Host configuration for the kit.
 *
 * Two components reach a server: `SearchImage` (and `Image`, when its URL
 * fails) looks up photos, and `Map` draws street geometry between stops. In the
 * Open Intelligent UI app those are Next routes under the app's base path,
 * resolved from NEXT_PUBLIC_BASE_PATH at build time. A published kit can assume
 * neither a Next app nor those routes, so the URLs are built here and a host can
 * replace any of them. The defaults are the app's own, so an app that already
 * serves those routes needs no configuration at all.
 */

export type IntelligentKitEndpoints = {
  /** Lead photo and coordinates of the Wikipedia article with exactly this title. */
  wiki: (title: string) => string;
  /** Photo search across Wikipedia and Wikimedia Commons. */
  imageSearch: (query: string) => string;
  /** Street geometry through stops written as "lat,lng;lat,lng". */
  streetRoute: (coords: string) => string;
};

export type IntelligentKitConfig = {
  /**
   * Path the app is served under, e.g. "/demo/intelligent-ui". A leading slash
   * is added if missing and trailing slashes are dropped, so the value cannot
   * turn the endpoints into page-relative URLs. Defaults to
   * NEXT_PUBLIC_BASE_PATH, else "".
   */
  basePath?: string;
  /** Replace any subset of the endpoint URL builders. */
  endpoints?: Partial<IntelligentKitEndpoints>;
};

/**
 * A base path is either empty or absolute. Without the leading slash the
 * endpoints below would be resolved against whatever page the user is on, so
 * the same request would go to a different path per route.
 */
const normaliseBasePath = (path: string): string => {
  const trimmed = path.replace(/\/+$/, "");
  if (trimmed === "") return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

/** NEXT_PUBLIC_BASE_PATH where a bundler inlines it; "" everywhere else. */
const envBasePath = (): string => {
  try {
    return normaliseBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "");
  } catch {
    // `process` is not defined in a plain browser bundle.
    return "";
  }
};

type ConfigState = { basePath: string; overrides: Partial<IntelligentKitEndpoints> };

/**
 * The state lives on globalThis under a registered symbol rather than in module
 * scope, because this package ships both ESM and CJS: a host whose server code
 * reaches one build and whose client code reaches the other would otherwise
 * hold two independent configurations, and configuring one would silently
 * leave the other on the defaults.
 */
const STATE_KEY = Symbol.for("@openuidev/intelligent-kit.config");

const readState = (): ConfigState => {
  const store = globalThis as unknown as Record<symbol, ConfigState | undefined>;
  const existing = store[STATE_KEY];
  if (existing) return existing;
  const created: ConfigState = { basePath: envBasePath(), overrides: {} };
  store[STATE_KEY] = created;
  return created;
};

const builtIn: IntelligentKitEndpoints = {
  wiki: (title) => `${readState().basePath}/api/wiki?title=${encodeURIComponent(title)}`,
  imageSearch: (query) => `${readState().basePath}/api/image-search?q=${encodeURIComponent(query)}`,
  streetRoute: (coords) => `${readState().basePath}/api/street-route?coords=${encodeURIComponent(coords)}`,
};

/** Point the kit at this host's routes. Call once, before rendering. */
export const configureIntelligentKit = (config: IntelligentKitConfig): void => {
  const state = readState();
  if (config.basePath !== undefined) state.basePath = normaliseBasePath(config.basePath);
  if (config.endpoints) state.overrides = { ...state.overrides, ...config.endpoints };
};

/**
 * Read through to the current configuration on every call: a host may configure
 * the kit after these modules are evaluated.
 */
export const endpoints: IntelligentKitEndpoints = {
  wiki: (title) => (readState().overrides.wiki ?? builtIn.wiki)(title),
  imageSearch: (query) => (readState().overrides.imageSearch ?? builtIn.imageSearch)(query),
  streetRoute: (coords) => (readState().overrides.streetRoute ?? builtIn.streetRoute)(coords),
};
