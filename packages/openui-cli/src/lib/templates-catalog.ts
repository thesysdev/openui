import { fetchSourceFile } from "./checkout";
import { CreateError } from "./telemetry";

export const TEMPLATES_CATALOG_PATH = "templates/templates.json";

export const DEFAULT_TEMPLATE_KEY = "openui-cloud";

export type CatalogOverlay = {
  name: string;
  key: string;
  description: string;
};

export type CatalogTemplate = {
  name: string;
  key: string;
  description: string;
  overlays: CatalogOverlay[];
};

function catalogError(message: string): CreateError {
  return new CreateError("args_resolution", message, "invalid_input", "TEMPLATE_CATALOG_INVALID");
}

function parseOverlay(item: unknown): CatalogOverlay {
  const overlay = item as CatalogOverlay;
  if (
    typeof overlay?.name !== "string" ||
    typeof overlay?.key !== "string" ||
    typeof overlay?.description !== "string"
  ) {
    throw catalogError(
      `${TEMPLATES_CATALOG_PATH} has an overlay missing name, key, or description.`,
    );
  }
  return overlay;
}

function parseTemplate(item: unknown): CatalogTemplate {
  const template = item as CatalogTemplate;
  if (
    typeof template?.name !== "string" ||
    typeof template?.key !== "string" ||
    typeof template?.description !== "string"
  ) {
    throw catalogError(
      `${TEMPLATES_CATALOG_PATH} has a template missing name, key, or description.`,
    );
  }
  if (!Array.isArray(template.overlays) || template.overlays.length === 0) {
    throw catalogError(`Template "${template.key}" has no overlays.`);
  }
  return { ...template, overlays: template.overlays.map(parseOverlay) };
}

function parseTemplatesCatalog(raw: string): CatalogTemplate[] {
  const parsed = JSON.parse(raw) as { templates?: unknown };
  if (!Array.isArray(parsed.templates) || parsed.templates.length === 0) {
    throw catalogError(`${TEMPLATES_CATALOG_PATH} must contain a non-empty "templates" array.`);
  }
  return parsed.templates.map(parseTemplate);
}

/** Prefetch the template catalog from GitHub. */
export async function loadTemplatesCatalog(): Promise<CatalogTemplate[]> {
  const { content } = await fetchSourceFile(TEMPLATES_CATALOG_PATH);
  return parseTemplatesCatalog(content);
}

export function findCatalogTemplate(templates: CatalogTemplate[], key: string): CatalogTemplate {
  const normalized = key.toLowerCase();
  const match = templates.find((entry) => entry.key.toLowerCase() === normalized);
  if (!match) {
    const available = templates.map((entry) => entry.key).join(" | ");
    throw new CreateError(
      "args_resolution",
      `unknown template "${key}". Use: ${available}.`,
      "invalid_input",
      "INVALID_TEMPLATE",
    );
  }
  return match;
}

export function findCatalogOverlay(template: CatalogTemplate, key: string): CatalogOverlay {
  const normalized = key.toLowerCase();
  const match = template.overlays.find((entry) => entry.key.toLowerCase() === normalized);
  if (!match) {
    const available = template.overlays.map((entry) => entry.key).join(" | ");
    throw new CreateError(
      "args_resolution",
      `unknown backend framework "${key}". Use: ${available}.`,
      "invalid_input",
      "INVALID_BACKEND_FRAMEWORK",
    );
  }
  return match;
}
