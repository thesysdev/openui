/**
 * WhatsApp payload normalizers. Interactive reply ids use the
 * `chat:{"a":actionId,"v":value}` format (see encodeReplyId); the Chat SDK's
 * WhatsApp adapter decodes it natively, and this decoder serves any other
 * transport.
 */
/**
 * The Cloud API request that marks the user's message as read and shows a
 * "typing…" indicator until the next reply is sent (or 25 seconds pass). POST
 * it to /{phone_number_id}/messages while the model generates.
 */
export function typingIndicator(messageId: string): Record<string, unknown> {
  return {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
    typing_indicator: { type: "text" },
  };
}

export function decodeReplyId(raw: string | undefined): { actionId: string; value?: string } {
  if (!raw) return { actionId: "" };
  if (!raw.startsWith("chat:")) return { actionId: raw };
  try {
    const parsed = JSON.parse(raw.slice(5));
    return { actionId: String(parsed.a ?? ""), value: parsed.v };
  } catch {
    return { actionId: raw };
  }
}
