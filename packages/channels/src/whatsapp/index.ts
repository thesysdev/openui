// @openui-channels whatsapp: the WhatsApp component library (honest to the
// platform's small native surface), the multi-message envelope, and payload
// normalizers.
export {
  buildSystemPrompt,
  encodeReplyId,
  library,
  systemPrompt,
  whatsappChannel,
} from "./library";
export { decodeReplyId, typingIndicator } from "./payload";
export type { WaMessage } from "./types";
