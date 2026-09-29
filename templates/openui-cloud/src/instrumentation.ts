const USER_AGENT = "openui-template/nextjs";

export function register() {
  const baseFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    headers.set("User-Agent", USER_AGENT);
    return baseFetch(input, { ...init, headers });
  };
}
