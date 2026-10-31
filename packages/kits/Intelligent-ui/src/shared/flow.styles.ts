import { css } from "goober";
import { tokens } from "./tokens";

const TITLE = ".openui-intelligent-title";
const TEXT = ".openui-intelligent-text";
const CAPTION = ".openui-intelligent-caption";
const FLOW = ".openui-intelligent-flow";

export const flowName = "openui-intelligent-flow";

/**
 * The spacing system: one scale (4/8/12/16/24px) in three tiers that always nest,
 * inner < group < section.
 *
 * - section (24px): every block of a page-level Col without gap.
 * - group (12px): blocks inside a card, grid cell or nested Col, and a heading to
 *   the block it introduces.
 * - inner (8px): a title to its own subtitle, tags or paragraph; tight (4px) for
 *   an eyebrow caption above a title.
 *
 * Not flat, because the children are whatever the model put there. `&&` keeps the
 * base rule above a child's own margin reset whichever registers first, and `&&&`
 * keeps a subtitle's gap above Card's opening-title rule.
 */
export const flow = css`
  && > * + * {
    margin-top: ${tokens.spaceSection};
  }
  & > ${TITLE} + * {
    margin-top: ${tokens.spaceGroup};
  }
  ${FLOW} & > * + *,
  &.openui-intelligent-card > * + * {
    margin-top: ${tokens.spaceGroup};
  }
  & > ${TEXT} + ${TEXT} {
    margin-top: ${tokens.spaceGroup};
  }
  &&& > ${TITLE} + ${TEXT},
  &&& > ${TITLE} + ${CAPTION},
  &&& > ${TITLE} + .openui-intelligent-row:has(> .openui-intelligent-badge) {
    margin-top: ${tokens.spaceInner};
  }
  & > ${CAPTION} + ${TITLE} {
    margin-top: ${tokens.spaceTight};
  }
`;

const BIG_TITLES = ["lg", "xl", "2xl", "3xl"];

/**
 * Inside a card or a grid cell, titles are card-sized (18/24) and body text is
 * 15/22. Also not flat: those are the model's children. `scope` is the selector
 * of the element whose children they are.
 */
export const cardSizedType = (scope: string) => `
  ${BIG_TITLES.map((size) => `${scope} > ${TITLE}--size-${size}`).join(",\n  ")} {
    font-size: 18px;
    line-height: 24px;
    letter-spacing: -0.3px;
  }
  ${scope} > ${TEXT}--size-default,
  ${scope} > ${TEXT}--size-md {
    font-size: 15px;
    line-height: 22px;
  }
`;
