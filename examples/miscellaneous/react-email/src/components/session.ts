const VIEW_KEY = "email-chat-view";
const MESSAGES_KEY = "email-chat-messages";

export function saveView(view: "compose" | "chat") {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch { /* ignore */ }
}

export function loadView(): "compose" | "chat" {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "chat") return "chat";
  } catch { /* ignore */ }
  return "compose";
}

export function saveMessages(messages: unknown[]) {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch { /* ignore */ }
}

export function loadMessages(): unknown[] | null {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

export function clearSession() {
  try {
    localStorage.removeItem(VIEW_KEY);
    localStorage.removeItem(MESSAGES_KEY);
  } catch { /* ignore */ }
}
