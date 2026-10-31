type SwatchScale = {
  25: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  925: string;
  950: string;
  1000: string;
};

// Values copied from design-system color-swatches.css.
const BASE_SWATCHES = {
  neutral: {
    25: "oklch(0.994 0 89.876 / 1)",
    50: "oklch(0.985 0 89.876 / 1)",
    100: "oklch(0.97 0 89.876 / 1)",
    200: "oklch(0.922 0 89.876 / 1)",
    300: "oklch(0.87 0 89.876 / 1)",
    400: "oklch(0.715 0 89.876 / 1)",
    500: "oklch(0.556 0 89.876 / 1)",
    600: "oklch(0.439 0 89.876 / 1)",
    700: "oklch(0.371 0 89.876 / 1)",
    800: "oklch(0.269 0 89.876 / 1)",
    900: "oklch(0.205 0 0 / 1)",
    925: "oklch(0.173 0 0 / 1)",
    950: "oklch(0.145 0 0 / 1)",
    1000: "oklch(0.097 0 0 / 1)",
  },
  slate: {
    25: "oklch(0.994 0.002 247.839 / 1)",
    50: "oklch(0.984 0.003 247.858 / 1)",
    100: "oklch(0.968 0.007 247.896 / 1)",
    200: "oklch(0.929 0.013 255.508 / 1)",
    300: "oklch(0.869 0.02 252.894 / 1)",
    400: "oklch(0.711 0.035 256.788 / 1)",
    500: "oklch(0.554 0.041 257.417 / 1)",
    600: "oklch(0.446 0.037 257.281 / 1)",
    700: "oklch(0.372 0.039 257.287 / 1)",
    800: "oklch(0.279 0.037 260.031 / 1)",
    900: "oklch(0.208 0.04 265.755 / 1)",
    925: "oklch(0.166 0.029 267.188 / 1)",
    950: "oklch(0.129 0.041 264.695 / 1)",
    1000: "oklch(0.091 0.029 268.957 / 1)",
  },
  gray: {
    25: "oklch(0.991 0.001 286.376 / 1)",
    50: "oklch(0.985 0.002 247.839 / 1)",
    100: "oklch(0.967 0.003 264.542 / 1)",
    200: "oklch(0.928 0.006 264.531 / 1)",
    300: "oklch(0.872 0.009 258.338 / 1)",
    400: "oklch(0.714 0.019 261.325 / 1)",
    500: "oklch(0.551 0.023 264.364 / 1)",
    600: "oklch(0.446 0.026 256.802 / 1)",
    700: "oklch(0.373 0.031 259.733 / 1)",
    800: "oklch(0.278 0.03 256.848 / 1)",
    900: "oklch(0.21 0.032 264.665 / 1)",
    925: "oklch(0.171 0.028 267.356 / 1)",
    950: "oklch(0.13 0.027 261.692 / 1)",
    1000: "oklch(0.089 0.024 267.878 / 1)",
  },
  zinc: {
    25: "oklch(0.994 0 89.876 / 1)",
    50: "oklch(0.985 0 89.876 / 1)",
    100: "oklch(0.967 0.001 286.375 / 1)",
    200: "oklch(0.92 0.004 286.32 / 1)",
    300: "oklch(0.871 0.005 286.286 / 1)",
    400: "oklch(0.712 0.013 286.067 / 1)",
    500: "oklch(0.552 0.014 285.938 / 1)",
    600: "oklch(0.442 0.015 285.786 / 1)",
    700: "oklch(0.37 0.012 285.805 / 1)",
    800: "oklch(0.274 0.005 286.033 / 1)",
    900: "oklch(0.21 0.006 285.885 / 1)",
    925: "oklch(0.179 0.004 285.981 / 1)",
    950: "oklch(0.141 0.004 285.823 / 1)",
    1000: "oklch(0.108 0.004 285.762 / 1)",
  },
  stone: {
    25: "oklch(0.994 0.001 106.423 / 1)",
    50: "oklch(0.985 0.001 106.423 / 1)",
    100: "oklch(0.97 0.001 106.424 / 1)",
    200: "oklch(0.923 0.003 48.717 / 1)",
    300: "oklch(0.869 0.004 56.366 / 1)",
    400: "oklch(0.716 0.009 56.259 / 1)",
    500: "oklch(0.553 0.012 58.071 / 1)",
    600: "oklch(0.444 0.01 73.639 / 1)",
    700: "oklch(0.374 0.009 67.558 / 1)",
    800: "oklch(0.268 0.006 34.298 / 1)",
    900: "oklch(0.216 0.006 56.043 / 1)",
    925: "oklch(0.184 0.005 67.497 / 1)",
    950: "oklch(0.147 0.004 49.25 / 1)",
    1000: "oklch(0.108 0.005 71.346 / 1)",
  },
  blue: {
    25: "oklch(0.986 0.007 247.894 / 1)",
    50: "oklch(0.97 0.014 254.604 / 1)",
    100: "oklch(0.932 0.032 255.585 / 1)",
    200: "oklch(0.882 0.057 254.128 / 1)",
    300: "oklch(0.809 0.096 251.813 / 1)",
    400: "oklch(0.714 0.143 254.624 / 1)",
    500: "oklch(0.623 0.188 259.815 / 1)",
    600: "oklch(0.546 0.215 262.881 / 1)",
    700: "oklch(0.488 0.217 264.376 / 1)",
    800: "oklch(0.424 0.181 265.638 / 1)",
    900: "oklch(0.379 0.138 265.522 / 1)",
    925: "oklch(0.328 0.111 266.206 / 1)",
    950: "oklch(0.282 0.087 267.935 / 1)",
    1000: "oklch(0.217 0.066 266.921 / 1)",
  },
  sky: {
    25: "oklch(0.991 0.006 223.454 / 1)",
    50: "oklch(0.977 0.012 236.62 / 1)",
    100: "oklch(0.951 0.025 236.824 / 1)",
    200: "oklch(0.901 0.055 230.902 / 1)",
    300: "oklch(0.828 0.101 230.318 / 1)",
    400: "oklch(0.754 0.139 232.661 / 1)",
    500: "oklch(0.685 0.148 237.323 / 1)",
    600: "oklch(0.588 0.139 241.966 / 1)",
    700: "oklch(0.5 0.119 242.749 / 1)",
    800: "oklch(0.443 0.1 240.79 / 1)",
    900: "oklch(0.391 0.085 240.876 / 1)",
    925: "oklch(0.339 0.07 239.068 / 1)",
    950: "oklch(0.293 0.063 243.157 / 1)",
    1000: "oklch(0.212 0.042 240.144 / 1)",
  },
  cyan: {
    25: "oklch(0.991 0.009 205.897 / 1)",
    50: "oklch(0.984 0.019 200.873 / 1)",
    100: "oklch(0.956 0.044 203.388 / 1)",
    200: "oklch(0.917 0.077 205.041 / 1)",
    300: "oklch(0.865 0.115 207.078 / 1)",
    400: "oklch(0.797 0.134 211.53 / 1)",
    500: "oklch(0.715 0.126 215.221 / 1)",
    600: "oklch(0.609 0.111 221.723 / 1)",
    700: "oklch(0.52 0.094 223.128 / 1)",
    800: "oklch(0.45 0.077 224.283 / 1)",
    900: "oklch(0.398 0.066 227.392 / 1)",
    925: "oklch(0.345 0.057 226.509 / 1)",
    950: "oklch(0.302 0.054 229.695 / 1)",
    1000: "oklch(0.217 0.037 227.615 / 1)",
  },
  teal: {
    25: "oklch(0.992 0.007 174.385 / 1)",
    50: "oklch(0.984 0.014 180.72 / 1)",
    100: "oklch(0.953 0.05 180.801 / 1)",
    200: "oklch(0.91 0.093 180.426 / 1)",
    300: "oklch(0.855 0.125 181.071 / 1)",
    400: "oklch(0.785 0.133 181.912 / 1)",
    500: "oklch(0.704 0.123 182.503 / 1)",
    600: "oklch(0.6 0.104 184.704 / 1)",
    700: "oklch(0.511 0.086 186.391 / 1)",
    800: "oklch(0.437 0.071 188.216 / 1)",
    900: "oklch(0.386 0.059 188.416 / 1)",
    925: "oklch(0.335 0.051 189.115 / 1)",
    950: "oklch(0.277 0.045 192.524 / 1)",
    1000: "oklch(0.206 0.033 191.443 / 1)",
  },
  emerald: {
    25: "oklch(0.99 0.01 164.879 / 1)",
    50: "oklch(0.979 0.021 166.113 / 1)",
    100: "oklch(0.95 0.051 163.051 / 1)",
    200: "oklch(0.905 0.089 164.15 / 1)",
    300: "oklch(0.845 0.13 164.978 / 1)",
    400: "oklch(0.773 0.153 163.223 / 1)",
    500: "oklch(0.696 0.149 162.48 / 1)",
    600: "oklch(0.596 0.127 163.225 / 1)",
    700: "oklch(0.508 0.105 165.612 / 1)",
    800: "oklch(0.432 0.086 166.913 / 1)",
    900: "oklch(0.378 0.073 168.94 / 1)",
    925: "oklch(0.325 0.062 169.847 / 1)",
    950: "oklch(0.262 0.049 172.552 / 1)",
    1000: "oklch(0.188 0.033 177.113 / 1)",
  },
  lime: {
    25: "oklch(0.993 0.018 120.67 / 1)",
    50: "oklch(0.986 0.031 120.757 / 1)",
    100: "oklch(0.967 0.066 122.328 / 1)",
    200: "oklch(0.938 0.122 124.321 / 1)",
    300: "oklch(0.897 0.179 126.665 / 1)",
    400: "oklch(0.849 0.207 128.85 / 1)",
    500: "oklch(0.768 0.204 130.85 / 1)",
    600: "oklch(0.648 0.175 131.684 / 1)",
    700: "oklch(0.532 0.141 131.589 / 1)",
    800: "oklch(0.453 0.113 130.933 / 1)",
    900: "oklch(0.405 0.096 131.063 / 1)",
    925: "oklch(0.341 0.079 131.173 / 1)",
    950: "oklch(0.274 0.069 132.109 / 1)",
    1000: "oklch(0.192 0.046 130.171 / 1)",
  },
  amber: {
    25: "oklch(0.993 0.012 96.417 / 1)",
    50: "oklch(0.987 0.021 95.277 / 1)",
    100: "oklch(0.962 0.058 95.617 / 1)",
    200: "oklch(0.924 0.115 95.746 / 1)",
    300: "oklch(0.879 0.153 91.605 / 1)",
    400: "oklch(0.837 0.164 84.429 / 1)",
    500: "oklch(0.769 0.165 70.08 / 1)",
    600: "oklch(0.666 0.157 58.318 / 1)",
    700: "oklch(0.555 0.146 48.998 / 1)",
    800: "oklch(0.473 0.125 46.201 / 1)",
    900: "oklch(0.414 0.105 45.904 / 1)",
    925: "oklch(0.35 0.087 45.765 / 1)",
    950: "oklch(0.279 0.074 45.635 / 1)",
    1000: "oklch(0.206 0.05 48.704 / 1)",
  },
  orange: {
    25: "oklch(0.987 0.01 72.664 / 1)",
    50: "oklch(0.98 0.016 73.684 / 1)",
    100: "oklch(0.954 0.037 75.164 / 1)",
    200: "oklch(0.901 0.073 70.697 / 1)",
    300: "oklch(0.837 0.117 66.29 / 1)",
    400: "oklch(0.758 0.159 55.934 / 1)",
    500: "oklch(0.705 0.187 47.604 / 1)",
    600: "oklch(0.646 0.194 41.116 / 1)",
    700: "oklch(0.553 0.174 38.402 / 1)",
    800: "oklch(0.47 0.143 37.304 / 1)",
    900: "oklch(0.408 0.116 38.172 / 1)",
    925: "oklch(0.342 0.096 37.716 / 1)",
    950: "oklch(0.266 0.076 36.259 / 1)",
    1000: "oklch(0.197 0.051 37.083 / 1)",
  },
  green: {
    25: "oklch(0.989 0.012 153.679 / 1)",
    50: "oklch(0.982 0.018 155.826 / 1)",
    100: "oklch(0.962 0.043 156.743 / 1)",
    200: "oklch(0.925 0.081 155.995 / 1)",
    300: "oklch(0.871 0.136 154.449 / 1)",
    400: "oklch(0.8 0.182 151.711 / 1)",
    500: "oklch(0.723 0.192 149.579 / 1)",
    600: "oklch(0.627 0.17 149.214 / 1)",
    700: "oklch(0.527 0.137 150.069 / 1)",
    800: "oklch(0.448 0.108 151.328 / 1)",
    900: "oklch(0.393 0.09 152.535 / 1)",
    925: "oklch(0.337 0.076 152.793 / 1)",
    950: "oklch(0.266 0.063 152.934 / 1)",
    1000: "oklch(0.19 0.041 156.904 / 1)",
  },
  yellow: {
    25: "oklch(0.995 0.013 102.007 / 1)",
    50: "oklch(0.987 0.026 102.212 / 1)",
    100: "oklch(0.973 0.069 103.193 / 1)",
    200: "oklch(0.945 0.124 101.54 / 1)",
    300: "oklch(0.905 0.166 98.111 / 1)",
    400: "oklch(0.861 0.173 91.936 / 1)",
    500: "oklch(0.795 0.162 86.047 / 1)",
    600: "oklch(0.681 0.142 75.834 / 1)",
    700: "oklch(0.554 0.121 66.442 / 1)",
    800: "oklch(0.476 0.103 61.907 / 1)",
    900: "oklch(0.421 0.09 57.708 / 1)",
    925: "oklch(0.357 0.075 57.491 / 1)",
    950: "oklch(0.286 0.064 53.813 / 1)",
    1000: "oklch(0.209 0.044 56.227 / 1)",
  },
  red: {
    25: "oklch(0.982 0.009 17.303 / 1)",
    50: "oklch(0.971 0.013 17.38 / 1)",
    100: "oklch(0.936 0.031 17.717 / 1)",
    200: "oklch(0.885 0.059 18.334 / 1)",
    300: "oklch(0.808 0.103 19.571 / 1)",
    400: "oklch(0.711 0.166 22.216 / 1)",
    500: "oklch(0.637 0.208 25.331 / 1)",
    600: "oklch(0.577 0.215 27.325 / 1)",
    700: "oklch(0.505 0.19 27.518 / 1)",
    800: "oklch(0.444 0.161 26.899 / 1)",
    900: "oklch(0.396 0.133 25.723 / 1)",
    925: "oklch(0.332 0.111 25.625 / 1)",
    950: "oklch(0.258 0.089 26.042 / 1)",
    1000: "oklch(0.184 0.058 25.017 / 1)",
  },
  purple: {
    25: "oklch(0.987 0.009 314.783 / 1)",
    50: "oklch(0.977 0.014 308.299 / 1)",
    100: "oklch(0.946 0.033 307.174 / 1)",
    200: "oklch(0.902 0.06 306.703 / 1)",
    300: "oklch(0.827 0.108 306.383 / 1)",
    400: "oklch(0.722 0.177 305.504 / 1)",
    500: "oklch(0.627 0.233 303.9 / 1)",
    600: "oklch(0.558 0.252 302.321 / 1)",
    700: "oklch(0.496 0.237 301.924 / 1)",
    800: "oklch(0.438 0.198 303.724 / 1)",
    900: "oklch(0.381 0.166 304.987 / 1)",
    925: "oklch(0.325 0.142 305.38 / 1)",
    950: "oklch(0.291 0.143 302.717 / 1)",
    1000: "oklch(0.205 0.098 304.68 / 1)",
  },
  violet: {
    25: "oklch(0.98 0.011 297.63 / 1)",
    50: "oklch(0.969 0.016 293.756 / 1)",
    100: "oklch(0.943 0.028 294.588 / 1)",
    200: "oklch(0.894 0.055 293.283 / 1)",
    300: "oklch(0.811 0.101 293.571 / 1)",
    400: "oklch(0.709 0.159 293.541 / 1)",
    500: "oklch(0.606 0.219 292.717 / 1)",
    600: "oklch(0.541 0.247 293.009 / 1)",
    700: "oklch(0.491 0.241 292.581 / 1)",
    800: "oklch(0.432 0.211 292.759 / 1)",
    900: "oklch(0.38 0.178 293.745 / 1)",
    925: "oklch(0.324 0.151 293.976 / 1)",
    950: "oklch(0.283 0.135 291.089 / 1)",
    1000: "oklch(0.203 0.088 292.692 / 1)",
  },
  fuchsia: {
    25: "oklch(0.984 0.012 329.558 / 1)",
    50: "oklch(0.977 0.017 320.058 / 1)",
    100: "oklch(0.952 0.036 318.852 / 1)",
    200: "oklch(0.903 0.073 319.62 / 1)",
    300: "oklch(0.833 0.132 321.434 / 1)",
    400: "oklch(0.748 0.207 322.16 / 1)",
    500: "oklch(0.667 0.259 322.15 / 1)",
    600: "oklch(0.591 0.257 322.896 / 1)",
    700: "oklch(0.518 0.226 323.949 / 1)",
    800: "oklch(0.452 0.192 324.591 / 1)",
    900: "oklch(0.401 0.16 325.612 / 1)",
    925: "oklch(0.341 0.135 326.232 / 1)",
    950: "oklch(0.293 0.131 325.661 / 1)",
    1000: "oklch(0.208 0.091 326.186 / 1)",
  },
  pink: {
    25: "oklch(0.986 0.009 341.798 / 1)",
    50: "oklch(0.971 0.014 343.198 / 1)",
    100: "oklch(0.948 0.028 342.258 / 1)",
    200: "oklch(0.899 0.059 343.231 / 1)",
    300: "oklch(0.823 0.11 346.018 / 1)",
    400: "oklch(0.725 0.175 349.761 / 1)",
    500: "oklch(0.656 0.212 354.308 / 1)",
    600: "oklch(0.592 0.218 0.584 / 1)",
    700: "oklch(0.525 0.199 3.958 / 1)",
    800: "oklch(0.459 0.17 3.815 / 1)",
    900: "oklch(0.408 0.144 2.432 / 1)",
    925: "oklch(0.347 0.124 2.558 / 1)",
    950: "oklch(0.284 0.105 3.907 / 1)",
    1000: "oklch(0.201 0.073 1.239 / 1)",
  },
} as const satisfies Record<string, SwatchScale>;

type SwatchName = keyof typeof BASE_SWATCHES;
type SwatchShade = keyof SwatchScale;

/** Absolute black in oklch format. */
export const black = "oklch(0 0 0 / 1)";
/** Absolute white in oklch format. */
export const white = "oklch(1 0 89.876 / 1)";

/**
 * Return a copy of an oklch color string with its alpha channel replaced.
 *
 * @param color - An oklch color string with `/ 1` alpha (e.g. `"oklch(0.5 0.1 260 / 1)"`)
 * @param alpha - New alpha value between 0 and 1
 * @returns The color string with the updated alpha
 *
 * @example
 * ```ts
 * withAlpha("oklch(0.5 0.1 260 / 1)", 0.5)
 * // => "oklch(0.5 0.1 260 / 0.5)"
 * ```
 */
export const withAlpha = (color: string, alpha: number): string =>
  color.replace(/\s\/\s(?:1|1\.0)\)$/, ` / ${alpha})`);

const STANDARD_ALPHA_STEPS = [
  0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
] as const;
const LEGACY_BLACK_WHITE_ALPHA_STEPS = [0, 0.16, 0.24, 0.32, 0.96] as const;
const SWATCH_SHADES: SwatchShade[] = [
  25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 925, 950, 1000,
];

const toAlphaSuffix = (alpha: number): string =>
  `a${Math.round(alpha * 100)
    .toString()
    .padStart(2, "0")}`;

const buildAlphaSwatches = (): Record<string, string> => {
  const map: Record<string, string> = {};

  for (const alpha of STANDARD_ALPHA_STEPS) {
    map[`black-${toAlphaSuffix(alpha)}`] = withAlpha(black, alpha);
    map[`white-${toAlphaSuffix(alpha)}`] = withAlpha(white, alpha);
  }
  for (const alpha of LEGACY_BLACK_WHITE_ALPHA_STEPS) {
    map[`black-${toAlphaSuffix(alpha)}`] = withAlpha(black, alpha);
    map[`white-${toAlphaSuffix(alpha)}`] = withAlpha(white, alpha);
  }

  for (const family of Object.keys(BASE_SWATCHES) as SwatchName[]) {
    const baseShade =
      family === "neutral" ||
      family === "slate" ||
      family === "gray" ||
      family === "zinc" ||
      family === "stone"
        ? 1000
        : 600;
    const base = BASE_SWATCHES[family][baseShade];
    for (const alpha of STANDARD_ALPHA_STEPS) {
      map[`${family}-${baseShade}-${toAlphaSuffix(alpha)}`] = withAlpha(base, alpha);
    }
  }

  return map;
};

const buildBaseTokenMap = (): Record<string, string> => {
  const map: Record<string, string> = {
    black,
    white,
  };

  for (const family of Object.keys(BASE_SWATCHES) as SwatchName[]) {
    for (const shade of SWATCH_SHADES) {
      map[`${family}-${shade}`] = BASE_SWATCHES[family][shade];
    }
  }

  return map;
};

const SWATCH_TOKENS: Record<string, string> = {
  ...buildBaseTokenMap(),
  ...buildAlphaSwatches(),
};

/** Swatch families suitable for neutral/background usage (low chroma). */
export type NeutralSwatchName = "neutral" | "slate" | "gray" | "zinc" | "stone";
/** Swatch families that can serve as brand/accent color (excludes semantic-only families). */
export type BrandSwatchName = Exclude<SwatchName, "green" | "yellow" | "red">;

/**
 * Look up a raw oklch color value by swatch family name and shade.
 *
 * @param name  - One of the 20 swatch families (e.g. `"blue"`, `"neutral"`)
 * @param shade - Shade step from 25 (lightest) to 1000 (darkest)
 * @returns The oklch color string
 *
 * @example
 * ```ts
 * swatch("blue", 600) // => "oklch(0.546 0.215 262.881 / 1)"
 * ```
 */
export const swatch = (name: SwatchName, shade: SwatchShade): string => BASE_SWATCHES[name][shade];

/**
 * Resolve a flat token key (e.g. `"blue-600"`, `"black-a50"`) to its oklch
 * color value. Returns `""` for unknown tokens.
 */
export const swatchToken = (token: string): string => SWATCH_TOKENS[token] ?? "";

/** The complete flat map of all swatch tokens (base shades + alpha variants). */
export const swatchTokens = SWATCH_TOKENS;
