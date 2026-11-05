/// <reference types="@lynx-js/rspeedy/client" />

declare const __DEFAULT_OPENUI_API_URL__: string;
declare const __IS_WEB__: boolean;

interface ImportMetaEnv {
  readonly PUBLIC_OPENUI_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
