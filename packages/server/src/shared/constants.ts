export const THESYS_API_BASE_URL = "https://api.thesys.dev";

/** Generates artifacts unless you pick another `provider/model`. */
export const DEFAULT_ARTIFACT_MODEL = "anthropic/claude-sonnet-4.6";

/** Names the artifact a background generation belongs to. */
export const ARTIFACT_ID_HEADER = "x-thesys-artifact-id";

/** The end user's frontend token: whose artifact it is, and who may read it. */
export const FRONTEND_TOKEN_HEADER = "x-thesys-frontend-token";
