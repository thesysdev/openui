import { invalidInput } from "./errors";
import { isIdList } from "./guards";
import type { CloudApi, CloudQuery } from "./http";
import type { RequestOptions } from "./resource";

/** Who a call is for: a user and their groups, or your org without `userId`. */
export interface ActAsOptions extends RequestOptions {
  /** The user to act as, from your session. Never take it from the browser. */
  userId?: string;
  /**
   * That user's groups, as on their frontend token, so what's shared with those groups
   * counts too. Only with `userId`. Up to 10, each up to 64 characters.
   */
  groupIds?: string[];
}

/** User, group and app fields, as a frontend token has them. Unchecked: callers check first. */
export function actAsFields(
  api: CloudApi,
  { userId, groupIds }: { userId: string; groupIds?: readonly string[] },
) {
  return {
    user_id: userId,
    ...(groupIds?.length && { group_ids: groupIds }),
    ...(api.appId !== undefined && { app_id: api.appId }),
  };
}

/** Checked fields to act as a user, as their frontend token would; without `userId`, the org. */
export function actAs(api: CloudApi, { userId, groupIds }: ActAsOptions = {}): CloudQuery {
  if (userId === undefined) {
    if (groupIds !== undefined) invalidInput("groupIds needs userId: they're that user's groups");
    return {};
  }
  if (typeof userId !== "string" || !userId.trim()) {
    invalidInput("userId must be a non-empty string: take it from your authenticated session");
  }
  if (groupIds !== undefined && !isIdList(groupIds)) {
    invalidInput("groupIds must be an array of non-empty strings");
  }
  return actAsFields(api, { userId, groupIds });
}

/** The query and signal of a call made as `options.userId`, or as your org. */
export const callAs = (api: CloudApi, options: ActAsOptions = {}) => ({
  query: actAs(api, options),
  signal: options.signal,
});
