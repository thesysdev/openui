// WhatsApp-specific types.

/**
 * One WhatsApp Cloud API message payload (the part that goes next to
 * messaging_product/to in POST /{phone_number_id}/messages). A render produces
 * an array of these. Chart markers carry a `chartId` the transport resolves to
 * an uploaded media id before sending.
 */
export type WaMessage = Record<string, any>;
