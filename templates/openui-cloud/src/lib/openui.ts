import { OpenUIApiError, OpenUIClient } from "@openuidev/server";
import { envOr } from "./env";

/**
 * The one local user: there's no sign-in. For multi-user apps, use the signed-in user's id from
 * your server-side session here, never one from the request.
 */
export const userId = envOr("DEMO_USER_ID", "demo-user");

/** Reads THESYS_API_KEY. APP_ID keeps this app's threads apart from other apps on the same key. */
export const openui = new OpenUIClient({ appId: process.env.APP_ID || undefined });

/** Whether the thread is this user's. The id comes from the browser, so check before using it. */
export async function ownsThread(threadId: string, signal?: AbortSignal): Promise<boolean> {
  try {
    return (await openui.conversations.get(threadId, { signal })).userId === userId;
  } catch (error) {
    if (error instanceof OpenUIApiError && error.status === 404) return false;
    throw error;
  }
}
