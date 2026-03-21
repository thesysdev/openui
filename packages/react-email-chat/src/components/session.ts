const VIEW_KEY = "email-chat-view";
const MESSAGES_KEY = "email-chat-messages";

export function saveView(view: "compose" | "chat") {
  try {
    sessionStorage.setItem(VIEW_KEY, view);
  } catch { /* ignore */ }
}

export function loadView(): "compose" | "chat" {
  try {
    const v = sessionStorage.getItem(VIEW_KEY);
    if (v === "chat") return "chat";
  } catch { /* ignore */ }
  return "compose";
}

export function saveMessages(messages: unknown[]) {
  try {
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch { /* ignore */ }
}

export function loadMessages(): unknown[] | null {
  try {
    const raw = sessionStorage.getItem(MESSAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

export function clearSession() {
  try {
    sessionStorage.removeItem(VIEW_KEY);
    sessionStorage.removeItem(MESSAGES_KEY);
  } catch { /* ignore */ }
}
