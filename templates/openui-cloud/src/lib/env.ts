export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function envOr(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export function isDevelopment() {
  return process.env.NODE_ENV === "development";
}
