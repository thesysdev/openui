import type { Bookmark } from "../github/types";

function storageKey(username: string): string {
  return `openui-gh-bookmarks-${username}`;
}

export function getBookmarks(username: string): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(username));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBookmark(
  username: string,
  repo: string,
  note?: string,
  tag?: string,
): Bookmark {
  const bookmarks = getBookmarks(username);
  const existing = bookmarks.findIndex((b) => b.repo === repo);
  const bookmark: Bookmark = {
    repo,
    note: note ?? "",
    tag: tag ?? "important",
    created_at: new Date().toISOString(),
  };

  if (existing >= 0) {
    bookmarks[existing] = bookmark;
  } else {
    bookmarks.unshift(bookmark);
  }

  localStorage.setItem(storageKey(username), JSON.stringify(bookmarks));
  return bookmark;
}

export function deleteBookmark(
  username: string,
  repo: string,
): { success: boolean } {
  const bookmarks = getBookmarks(username);
  const filtered = bookmarks.filter((b) => b.repo !== repo);
  localStorage.setItem(storageKey(username), JSON.stringify(filtered));
  return { success: true };
}
