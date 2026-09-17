import type { CloudAuthMethod, ResolvedAuthMethod } from "../auth/mint";

/** Template `key` from `templates/templates.json`. */
export type TemplateName = string;
/** Overlay `key` from the selected template's `overlays` list, or `default`. */
export type OverlayName = string;

export interface CreateAppOptions {
  name?: string;
  template?: TemplateName;
  backendFramework?: OverlayName;
  example?: string;
  skill?: boolean;
  noInteractive?: boolean;
  noInstall?: boolean;
  immediate?: boolean;
  verbose?: boolean;
  apiKey?: string;
  auth?: CloudAuthMethod;
}

export type AiSetup = "openui_cloud" | "openai_compatible_provider";

export type EnvResult = {
  envWritten: boolean;
  envContent?: string;
  authMethod?: ResolvedAuthMethod;
  authSucceeded?: boolean;
};
