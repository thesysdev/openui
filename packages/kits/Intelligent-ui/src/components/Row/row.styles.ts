import { css } from "goober";
import { tokens } from "../../shared/tokens";

const PHOTO = ".openui-intelligent-photo";
const PHOTO_BOX = ".openui-intelligent-box:has(> .openui-intelligent-photo:only-child)";

export const names = { root: "openui-intelligent-row" } as const;

/**
 * Not flat, because the children are the model's. The media row sets a photo beside text: a fixed
 * 4:3, a third of the row (120-200px), 16px from text that starts at the photo's top edge. It needs
 * !important because a Row's gap and alignment, and a photo's size, are inline styles.
 */
export const styles = {
  root: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    min-width: 0;
    & > * {
      min-width: 0;
    }
    &:has(> ${PHOTO}) {
      align-items: flex-start !important;
      gap: ${tokens.spaceGroupLg} !important;
    }
    & > ${PHOTO},
    & > ${PHOTO_BOX} {
      flex: none !important;
      width: clamp(120px, 33%, 200px) !important;
    }
    & > .openui-intelligent-box > ${PHOTO}:only-child,
    & > ${PHOTO} {
      aspect-ratio: 4 / 3 !important;
      height: auto !important;
    }
  `,
};
