// Kept apart from lib/source.ts on purpose: importing that module pulls every
// docs and blog MDX page, and their client components, into the importer's
// client bundle. The root layout and marketing pages only need this constant.
export const BASE_URL = "https://www.openui.com";
