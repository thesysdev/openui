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

const trimEnd = (path: string) => path.replace(/\/+$/, "");

/** NEXT_PUBLIC_BASE_PATH where a bundler inlines it; "" everywhere else. */
const envBasePath = (): string => {
  try {
    return trimEnd(process.env.NEXT_PUBLIC_BASE_PATH ?? "");
  } catch {
    // `process` is not defined in a plain browser bundle.
    return "";
  }
};

export type IntelligentKitEndpoints = {
  /** Lead photo and coordinates of the Wikipedia article with exactly this title. */
  wiki: (title: string) => string;
  /** Photo search across Wikipedia and Wikimedia Commons. */
  imageSearch: (query: string) => string;
  /** Street geometry through stops written as "lat,lng;lat,lng". */
  streetRoute: (coords: string) => string;
};

export type IntelligentKitConfig = {
  /** Path the app is served under. Defaults to NEXT_PUBLIC_BASE_PATH, else "". */
  basePath?: string;
  /** Replace any subset of the endpoint URL builders. */
  endpoints?: Partial<IntelligentKitEndpoints>;
};

let basePath = envBasePath();
let overrides: Partial<IntelligentKitEndpoints> = {};

const builtIn: IntelligentKitEndpoints = {
  wiki: (title) => `${basePath}/api/wiki?title=${encodeURIComponent(title)}`,
  imageSearch: (query) => `${basePath}/api/image-search?q=${encodeURIComponent(query)}`,
  streetRoute: (coords) => `${basePath}/api/street-route?coords=${encodeURIComponent(coords)}`,
};

/** Point the kit at this host's routes. Call once, before rendering. */
export const configureIntelligentKit = (config: IntelligentKitConfig): void => {
  if (config.basePath !== undefined) basePath = trimEnd(config.basePath);
  if (config.endpoints) overrides = { ...overrides, ...config.endpoints };
};

/**
 * Read through to the current configuration on every call: a host may configure
 * the kit after these modules are evaluated.
 */
export const endpoints: IntelligentKitEndpoints = {
  wiki: (title) => (overrides.wiki ?? builtIn.wiki)(title),
  imageSearch: (query) => (overrides.imageSearch ?? builtIn.imageSearch)(query),
  streetRoute: (coords) => (overrides.streetRoute ?? builtIn.streetRoute)(coords),
};

/** The configured base path prefixed to a hand-written path. */
export const withBase = (path: string) => `${basePath}${path}`;
