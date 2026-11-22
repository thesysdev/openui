/**
 * Telegram payload normalizers. Callback data is capped at 64 BYTES by the
 * Bot API, so interactive ids use a compact `actionId|value` encoding (the
 * value part only for bound inputs like Select options).
 */

export function encodeCallback(actionId: string, value?: string): string {
  return value === undefined ? actionId : `${actionId}|${value}`;
}

export function decodeCallback(data: string | undefined): { actionId: string; value?: string } {
  if (!data) return { actionId: "" };
  const i = data.indexOf("|");
  return i === -1 ? { actionId: data } : { actionId: data.slice(0, i), value: data.slice(i + 1) };
}

/** True when the encoded callback fits Telegram's 64-byte limit. */
export function callbackFits(data: string): boolean {
  return new TextEncoder().encode(data).length <= 64;
}
