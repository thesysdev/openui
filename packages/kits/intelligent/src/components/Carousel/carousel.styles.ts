import { css } from "goober";
import { cardSizedType } from "../../shared/flow.styles";

export const names = {
  root: "openui-intelligent-carousel",
  track: "openui-intelligent-carousel-track",
  item: "openui-intelligent-carousel-item",
} as const;

/**
 * Scrolling, snapping and the arrows come from react-components. The track keeps 4px of block
 * padding (pulled back with a negative margin) so items' focus rings are not clipped, and contains
 * overscroll so a sideways swipe at the end does not navigate back. An item's rules on its child are
 * not flat, because the child is the model's.
 */
export const styles = {
  root: css`
    &.openui-carousel {
      min-width: 0;
    }
  `,
  track: css`
    &.openui-carousel-content {
      margin-block: -4px;
      padding-block: 4px;
      overscroll-behavior-x: contain;
    }
  `,
  item: css`
    flex: none;
    max-width: 85%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    & > .openui-intelligent-card,
    & > .openui-intelligent-pressable {
      height: 100%;
    }
    ${cardSizedType("& > .openui-intelligent-flow")}
  `,
};
