export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const THESYS_BASE_URL = process.env.THESYS_BASE_URL || "https://api.thesys.dev/v1/embed";
export const MODEL = process.env.THESYS_MODEL || "google/gemini-3.6-flash-free";
