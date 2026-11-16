import type { Theme as ComponentsTheme } from "@openuidev/react-components";

/**
 * The Intelligent UI library's own theme keys. Each `intelligentX` key becomes the
 * `--openui-intelligent-x` variable the components read (`intelligentChart1` →
 * `--openui-intelligent-chart-1`), the same way react-components names its keys.
 *
 * Unset colour keys fall back to react-components' colours (see `shared/tokens.ts`), so a
 * `textNeutralPrimary` override reaches the library too. Only what react-components has no
 * token for gets a default below: chart colours, spacing, corner radius and the mono font.
 */
export type IntelligentTheme = {
  intelligentFont?: string;
  intelligentMono?: string;
  intelligentCanvas?: string;
  intelligentHover?: string;
  intelligentPressed?: string;
  intelligentSurface?: string;
  intelligentSurfaceStrong?: string;
  intelligentInk?: string;
  intelligentInkHover?: string;
  intelligentOnInk?: string;
  intelligentMuted?: string;
  intelligentFaint?: string;
  intelligentBorder?: string;
  intelligentBorderStrong?: string;
  intelligentRangeTrack?: string;
  intelligentRangeThumb?: string;
  intelligentFocus?: string;
  intelligentGlass?: string;
  intelligentGlassHover?: string;
  intelligentGlassRing?: string;
  intelligentGlassRingHover?: string;
  intelligentShadow?: string;
  intelligentShadowSm?: string;
  intelligentInfo?: string;
  intelligentInfoSoft?: string;
  intelligentSuccess?: string;
  intelligentSuccessSoft?: string;
  intelligentWarning?: string;
  intelligentWarningSoft?: string;
  intelligentDanger?: string;
  intelligentDangerSoft?: string;
  intelligentPurple?: string;
  intelligentPurpleSoft?: string;
  intelligentPink?: string;
  intelligentPinkSoft?: string;
  intelligentBadgeNeutralSoft?: string;
  intelligentBadgeSuccess?: string;
  intelligentBadgeSuccessSoft?: string;
  intelligentBadgeWarning?: string;
  intelligentBadgeWarningSoft?: string;
  intelligentBadgeDanger?: string;
  intelligentBadgeDangerSoft?: string;
  intelligentBadgePurple?: string;
  intelligentBadgePurpleSoft?: string;
  intelligentBadgePink?: string;
  intelligentBadgePinkSoft?: string;
  intelligentChart1?: string;
  intelligentChart2?: string;
  intelligentChart3?: string;
  intelligentChart4?: string;
  intelligentChart5?: string;
  intelligentChart6?: string;
  intelligentSpaceTight?: string;
  intelligentSpaceInner?: string;
  intelligentSpaceGroup?: string;
  intelligentSpaceGroupLg?: string;
  intelligentSpaceSection?: string;
  intelligentControlGap?: string;
  intelligentFieldGap?: string;
  intelligentActionGap?: string;
  intelligentRadiusSm?: string;
  intelligentRadiusMd?: string;
  intelligentRadiusLg?: string;
  intelligentRadiusXl?: string;
  intelligentRadius2xl?: string;
  intelligentPhotoEmpty?: string;
  intelligentPhotoEmptyIcon?: string;
};

/** A theme for the library's ThemeProvider: react-components' keys plus the library's own. */
export type Theme = ComponentsTheme & IntelligentTheme;

const shared = {
  intelligentMono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  intelligentChart1: "#0285ff",
  intelligentChart2: "#00a67d",
  intelligentChart3: "#8b5cf6",
  intelligentChart4: "#f4a340",
  intelligentChart5: "#e46d91",
  intelligentChart6: "#4b9ca6",
  intelligentSpaceTight: "4px",
  intelligentSpaceInner: "8px",
  intelligentSpaceGroup: "12px",
  intelligentSpaceGroupLg: "16px",
  intelligentSpaceSection: "24px",
  intelligentControlGap: "8px",
  intelligentFieldGap: "24px",
  intelligentActionGap: "40px",
  intelligentRadiusSm: "6px",
  intelligentRadiusMd: "10px",
  intelligentRadiusLg: "12px",
  intelligentRadiusXl: "14px",
  intelligentRadius2xl: "20px",
} satisfies IntelligentTheme;

export const defaultLightTheme: IntelligentTheme = { ...shared };
export const defaultDarkTheme: IntelligentTheme = { ...shared };
