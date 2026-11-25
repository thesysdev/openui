import { OpenUIApiError } from "./core/errors";
import type { CloudApi } from "./core/http";
import { isIdList } from "./interpreter/types";

export interface CreateFrontendTokenParams {
  /** The signed-in user, from your session. The token reads their artifacts and those shared with them. */
  userId: string;
  /**
   * The groups the user is in, from your own system: artifacts shared with any of them are
   * readable too. Up to 10, each up to 64 characters. The token carries them until it expires,
   * so a change shows on the next token.
   */
  groupIds?: string[];
}

/** A user's frontend token, in the shape the browser's `createFrontendTokenManager` reads. */
export interface FrontendToken {
  /** `fct_…`, for the `x-thesys-frontend-token` header. */
  token: string;
  /** When it expires, in unix seconds. */
  expires_at: number;
}

/**
 * Mints a frontend token for `userId` and their `groupIds`, in the client's app if it has one,
 * with your API key.
 */
export async function createFrontendToken(
  api: CloudApi,
  userId: unknown,
  groupIds: unknown,
  signal?: AbortSignal,
): Promise<FrontendToken> {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new OpenUIApiError(
      "userId is required: take it from your authenticated session",
      "invalid_input",
    );
  }
  if (groupIds !== undefined && !isIdList(groupIds)) {
    throw new OpenUIApiError("groupIds must be an array of non-empty strings", "invalid_input");
  }
  const { token, expires_at } = await api.post(
    "/v1/frontend-tokens",
    {
      user_id: userId,
      ...(groupIds?.length && { group_ids: groupIds }),
      ...(api.appId !== undefined && { app_id: api.appId }),
    },
    signal,
  );
  if (typeof token !== "string" || !token || typeof expires_at !== "number") {
    throw new OpenUIApiError("Invalid OpenUI Cloud response", "invalid_response", 502);
  }
  return { token, expires_at };
}
