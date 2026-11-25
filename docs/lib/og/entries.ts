import { ogPages } from "@/generated/og-pages";
import { pageOgImage, SITE_OG_IMAGE } from "../page-metadata";
import { blog, source } from "../source";
import { blogOgImage, docsOgImage } from "./content";
import type { OgImage } from "./images";

let images: Map<string, OgImage> | undefined;

/** Every prerendered OG image, keyed by page path. Throws on duplicate paths. */
export function getOgImages(): Map<string, OgImage> {
  if (images) return images;

  const all: OgImage[] = [SITE_OG_IMAGE];
  for (const [path, page] of Object.entries(ogPages)) {
    if (page.pathname !== path) {
      throw new Error(`metadata.ts for ${path} declares pathname ${page.pathname}`);
    }
    all.push(pageOgImage(page));
  }
  // Dynamic routes: one adapter per content collection.
  all.push(...blog.getPages().map(blogOgImage), ...source.getPages().map(docsOgImage));

  images = new Map();
  for (const image of all) {
    if (images.has(image.path)) throw new Error(`Duplicate OG image path: ${image.path}`);
    images.set(image.path, image);
  }
  return images;
}
