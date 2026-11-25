import { actAs } from "./core/act-as";
import { invalidInput, invalidResponse } from "./core/errors";
import type { CloudApi } from "./core/http";

export interface CreateFrontendTokenParams {
  /** The signed-in user, from your session: the token reads their artifacts and shared ones. */
  userId: string;
  /**
   * The user's groups, from your system: artifacts shared with them are readable too.
   * Up to 10, each up to 64 characters. A change shows on the next token.
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

/** Mints a frontend token for `userId` and their `groupIds`, in the client's app if any. */
export async function createFrontendToken(
  api: CloudApi,
  params: CreateFrontendTokenParams,
  signal?: AbortSignal,
): Promise<FrontendToken> {
  const { userId, groupIds } = params;
  // Required here, where acting as nobody would mean the org.
  if (typeof userId !== "string" || !userId.trim()) {
    invalidInput("userId is required: take it from your authenticated session");
  }
  // actAs checks groupIds and adds the client's app.
  const body = actAs(api, { userId, groupIds });
  const { token, expires_at } = await api.send("POST", "/v1/frontend-tokens", { body, signal });
  if (typeof token !== "string" || !token || typeof expires_at !== "number") {
    throw invalidResponse();
  }
  return { token, expires_at };
}
