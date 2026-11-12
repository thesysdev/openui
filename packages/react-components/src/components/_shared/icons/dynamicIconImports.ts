import type { LucideIcon } from "lucide-react";
import { toKebabIconCandidates } from "./iconNames";
// .mjs import (extension needed for strict-ESM consumers); types come from
// the sibling .d.mts declaration.
import lucideDynamicIconImports from "./lucide/lucideDynamicImports.mjs";

type IconImport = () => Promise<{ default: LucideIcon }>;

/**
 * CJS interop: this package ships both CJS and ESM builds. When the CJS
 * build loads the `.mjs` icon map, the import hands back a namespace object
 * (`{ __esModule, default: map }`) instead of the map itself, and bundler
 * interop helpers can stack a second `default` layer on top. Unwrap until we
 * reach the actual key → import-thunk map (`circle` is a stable lucide key),
 * else every icon silently resolves null for CJS consumers.
 */
export const unwrapModuleDefault = (mod: unknown): Record<string, IconImport> => {
  let candidate = mod as Record<string, unknown>;
  while (
    candidate != null &&
    typeof candidate === "object" &&
    typeof candidate["circle"] !== "function" &&
    "default" in candidate
  ) {
    candidate = candidate["default"] as Record<string, unknown>;
  }
  return (candidate ?? {}) as Record<string, IconImport>;
};

const exactDynamicIconImports = unwrapModuleDefault(lucideDynamicIconImports);

const getArrayPermutations = <T>(arr: T[]): T[][] => {
  if (arr.length === 0) {
    return [[]];
  }

  const firstElement = arr[0];
  const rest = arr.slice(1);

  const permsWithoutFirst = getArrayPermutations(rest);

  const allPermutations: T[][] = [];

  permsWithoutFirst.forEach((perm) => {
    for (let i = 0; i <= perm.length; i++) {
      const permWithFirst = [
        ...perm.slice(0, i), // Elements before insertion point
        firstElement,
        ...perm.slice(i), // Elements after insertion point
      ].filter((item) => item !== undefined) as T[];

      allPermutations.push(permWithFirst);
    }
  });

  return allPermutations;
};

const getIconNamePermutations = (inputString: string): string[] => {
  const words = inputString
    .trim()
    .split(/-/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return [""];
  }

  const wordPermutations = getArrayPermutations(words);

  const stringPermutations = wordPermutations.map((perm) => perm.join("-"));

  return stringPermutations;
};

const permutationIconImports = Object.entries(exactDynamicIconImports).reduce(
  (acc, [key, value]) => {
    const iconNamePermutations = getIconNamePermutations(key);
    iconNamePermutations.forEach((iconName) => {
      acc[iconName] = value;
    });
    return acc;
  },
  {} as Record<string, IconImport>,
);

// Permutation aliases are fuzzy matches and can collide with real Lucide keys
// (`arrow-down-up` is also a permutation of `arrow-up-down`). Overlay the raw
// catalog last so an exact key always keeps its upstream icon mapping.
export const dynamicIconImports: Record<string, IconImport> = Object.assign(
  permutationIconImports,
  exactDynamicIconImports,
);

const getIconNameMatchVariations = (iconName: string) => {
  const iconNameParts = iconName.split("-");
  const iconNameVariations: string[] = [iconNameParts[0]!];

  let lastVariation: string = iconNameVariations[0]!;

  for (const part of iconNameParts.slice(1)) {
    const newVariation = `${lastVariation}-${part}`;
    lastVariation = newVariation;
    iconNameVariations.push(newVariation);
  }

  return iconNameVariations.reverse();
};

export const getIconImport = (iconName: string) => {
  // The map is keyed kebab-case (the canonical wire format); tolerate
  // PascalCase/camelCase input by also trying the kebab normalizations.
  const kebabCandidates = toKebabIconCandidates(iconName);
  for (const candidate of [iconName, ...kebabCandidates]) {
    const iconImport = dynamicIconImports[candidate as keyof typeof dynamicIconImports];

    if (iconImport) {
      return iconImport;
    }
  }

  const iconNameImportVariations = getIconNameMatchVariations(kebabCandidates[0] ?? iconName);

  for (const variation of iconNameImportVariations) {
    const iconImport = dynamicIconImports[variation as keyof typeof dynamicIconImports];

    if (iconImport) {
      return iconImport;
    }
  }

  return null;
};
