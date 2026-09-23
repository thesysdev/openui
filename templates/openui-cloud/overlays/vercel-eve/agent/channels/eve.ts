import { none } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

/**
 * Eve's built-in HTTP channel: serves `/eve/v1/session*` (deliver + resumable
 * NDJSON event stream). `none()` allows anonymous traffic for local development —
 * swap in `bearer()` / `basic()` before exposing this publicly.
 */
export default eveChannel({ auth: none() });
