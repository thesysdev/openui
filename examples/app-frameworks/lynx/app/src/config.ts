const configuredUrl = import.meta.env.PUBLIC_OPENUI_API_URL?.trim();

export const OPENUI_API_URL = configuredUrl || __DEFAULT_OPENUI_API_URL__;
