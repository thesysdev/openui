import { css } from "goober";
import { cardSizedType } from "../../shared/flow.styles";
import { tokens } from "../../shared/tokens";

const TITLES = [".openui-intelligent-title--size-sm", ".openui-intelligent-title--size-md"];
const SUBTITLES = [".openui-intelligent-caption", ".openui-intelligent-text"];
const OPENERS = TITLES.flatMap((title) => [`& > ${title}:first-child`, `& > .openui-intelligent-row:first-child ${title}`]);

export const names = {
  root: "openui-intelligent-card",
  variant: { outline: "openui-intelligent-card--variant-outline", soft: "openui-intelligent-card--variant-soft" },
} as const;

/**
 * The opening title and card-sized type are not flat, because the children are the model's. A small
 * or medium title that opens a card reads as the card title: 14/20 Medium, with a 13/18 secondary
 * subtitle. Card-sized type comes after it and at the same weight, because a Text subtitle stays
 * at body size.
 */
export const styles = {
  root: css`
    display: flex;
    flex-direction: column;
    min-width: 0;
    width: 100%;
    padding: 20px;
    border: 1px solid var(--_openui-intelligent-card-border, ${tokens.border});
    border-radius: ${tokens.radiusXl};
    background: var(--_openui-intelligent-card-background, ${tokens.canvas});
    font-size: 14px;
    line-height: 1.55;
    @media (max-width: 640px) {
      padding: 16px;
    }
    .openui-intelligent-card & {
      border-radius: ${tokens.radiusLg};
      padding: 16px;
    }
    ${OPENERS.join(",\n    ")} {
      font-size: 14px;
      line-height: 20px;
      font-weight: 560;
    }
    ${OPENERS.flatMap((opener) => SUBTITLES.map((subtitle) => `${opener} + ${subtitle}`)).join(",\n    ")} {
      margin-top: 2px;
      color: ${tokens.muted};
      font-size: 13px;
      line-height: 18px;
    }
    ${cardSizedType("&&&")}
  `,
  variant: {
    outline: css`
      --_openui-intelligent-card-border: ${tokens.border};
      --_openui-intelligent-card-background: ${tokens.canvas};
    `,
    soft: css`
      --_openui-intelligent-card-border: transparent;
      --_openui-intelligent-card-background: ${tokens.surface};
    `,
  },
};
