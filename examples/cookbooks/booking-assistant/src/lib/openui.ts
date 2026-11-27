import { OpenUIApiError, OpenUIClient } from "@openuidev/server";

// There is no sign-in, so every browser shares one local user, as in apps from
// `openui create`. Use the signed-in user's id instead when you add authentication:
// https://www.openui.com/docs/gateway/authentication
export const userId = process.env.DEMO_USER_ID || "demo-user";

// Reads THESYS_API_KEY. The app keeps this example's threads apart from other apps that use the
// same key: frontend tokens and the threads they create carry it.
export const openui = new OpenUIClient({
  appId: process.env.APP_ID || "booking-assistant-cookbook",
});

/** Whether the thread is this user's. The id comes from the browser, so check before using it. */
export async function ownsThread(threadId: string, signal?: AbortSignal): Promise<boolean> {
  try {
    return (await openui.conversations.get(threadId, { signal })).userId === userId;
  } catch (error) {
    if (error instanceof OpenUIApiError && error.status === 404) return false;
    throw error;
  }
}
