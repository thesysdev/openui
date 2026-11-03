import { css } from "@openuidev/react-components";
import { cardSizedType } from "../../shared/flow.styles";
import { tokens } from "../../shared/tokens";

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
 *
 * react-components hangs its arrows 12px outside the carousel on a square backing in the page
 * colour. A chat bubble clips anything outside it, which cut the arrow in half, so the kit draws
 * the source's arrows instead: inside the edge, round, in the frosted glass of the map controls.
 */
export const carouselStyles = {
  root: css`
    font-variation-settings: normal;
    &.openui-carousel {
      min-width: 0;
    }
    & .openui-carousel-button {
      background: transparent;
      border-radius: 999px;
    }
    & .openui-carousel-button-left {
      left: 8px;
    }
    & .openui-carousel-button-right {
      right: 8px;
    }
    & .openui-carousel-button .openui-icon-button {
      width: 34px;
      height: 34px;
      border-color: transparent;
      background: ${tokens.glass};
      color: ${tokens.ink};
      backdrop-filter: blur(12px) saturate(1.4);
      box-shadow:
        inset 0 0 0 1px ${tokens.glassRing},
        0 2px 12px rgb(0 0 0 / 8%);
      transition:
        background-color 120ms ease-out,
        box-shadow 120ms ease-out;
    }
    & .openui-carousel-button .openui-icon-button:hover {
      background: ${tokens.glassHover};
      box-shadow:
        inset 0 0 0 1px ${tokens.glassRingHover},
        0 2px 12px rgb(0 0 0 / 8%);
    }
    /* On a touch screen the row is swiped, as in the source app. */
    @media (hover: none) {
      & .openui-carousel-button {
        display: none;
      }
    }
  `,
  track: css`
    nullbox-sizing: border-box;
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
