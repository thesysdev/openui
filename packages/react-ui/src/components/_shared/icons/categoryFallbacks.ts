/**
 * Semantic icon-category → representative lucide icon name (kebab-case).
 *
 * When an icon name doesn't resolve, surfaces fall back to the category's
 * representative icon before their own generic fallback, so a miss still
 * renders something topical (`finance` → dollar sign, not a bare circle).
 */
export const categoryFallbacks: Record<string, string> = {
  accessibility: "accessibility",
  account: "user",
  animals: "cat",
  arrows: "arrow-right",
  brands: "box",
  buildings: "building",
  charts: "chart-line",
  communication: "message-square",
  connectivity: "wifi",
  cursors: "mouse-pointer",
  design: "palette",
  development: "code",
  devices: "smartphone",
  emoji: "smile",
  files: "file",
  finance: "dollar-sign",
  "food-beverage": "cooking-pot",
  gaming: "gamepad",
  home: "house",
  layout: "layout",
  mail: "mail",
  math: "calculator",
  medical: "heart-pulse",
  multimedia: "music",
  nature: "tree-pine",
  navigation: "map-pin",
  notifications: "bell",
  people: "users",
  photography: "camera",
  science: "microscope",
  seasons: "sun",
  security: "shield",
  shapes: "circle",
  shopping: "shopping-cart",
  social: "share-2",
  sports: "trophy",
  sustainability: "leaf",
  text: "type",
  time: "clock",
  tools: "wrench",
  transportation: "car",
  travel: "plane",
  weather: "cloud",
};

/** Rendered when neither the icon name nor its category resolves. */
export const defaultFallbackIconName = "circle-dot";

/** The icon name to load when a requested icon name misses the catalog. */
export const getFallbackIconName = (category?: string): string =>
  categoryFallbacks[category?.trim().toLowerCase() ?? ""] ?? defaultFallbackIconName;
