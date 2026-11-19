// Telegram-specific types.

/**
 * One rendered Telegram card: rich message blocks (Bot API 10.1+
 * InputRichBlock objects) plus inline keyboard rows. A render produces one
 * card, sent with sendRichMessage and edited in place with editMessageText.
 * Chart photo blocks reference `attach://chart_<n>`; the transport attaches
 * the rasterized PNGs when sending.
 */
export type TgCard = {
  blocks: Record<string, any>[];
  keyboard: Record<string, any>[][];
};
