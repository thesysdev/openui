import type { CloudApi } from "./api";
import { OpenUIApiError, type FrontendToken } from "./types";

/** Mints a frontend token for `userId` with your API key. */
export async function createFrontendToken(
  api: CloudApi,
  userId: unknown,
  signal?: AbortSignal,
): Promise<FrontendToken> {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new OpenUIApiError(
      "userId is required: take it from your authenticated session",
      "invalid_input",
    );
  }
  const { token, expires_at } = await api.post("/v1/frontend-tokens", { user_id: userId }, signal);
  if (typeof token !== "string" || !token || typeof expires_at !== "number") {
    throw new OpenUIApiError("Invalid OpenUI Cloud response", "invalid_response", 502);
  }
  return { token, expires_at };
}
