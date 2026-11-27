// Discord-specific types.

/** Discord message flag that opts a message into Components V2 layouts. */
export const IS_COMPONENTS_V2 = 1 << 15;

/**
 * One rendered Discord message: a Components V2 body (`flags` includes
 * IS_COMPONENTS_V2, so `content`/`embeds` must be omitted). Sent with
 * POST /channels/{id}/messages or an interaction response, and edited in place
 * with an UPDATE_MESSAGE (type 7) interaction response. Chart media items
 * reference `attachment://chart_<n>.png`; the transport uploads the rasterized
 * PNGs as files with those names.
 */
export type DiscordMessage = {
  flags: number;
  /** Always `{ parse: [] }`: text in a card never pings users, roles or @everyone. */
  allowed_mentions?: { parse: string[] };
  components: Record<string, any>[];
};

/** A modal (type 9 interaction response data) opened by a Form button. */
export type DiscordModal = {
  custom_id: string;
  title: string;
  components: Record<string, any>[];
};
