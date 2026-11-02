import { css } from "../../../../styles/css";

import { fadeAppearAnimation } from "../animations/fadeAppear.styles";

export const miniChartStyles = {
  root: css`
    position: relative;
    aspect-ratio: 1/1;
    min-width: 100px;
    min-height: 100px;
    &[data-clickable] {
      cursor: pointer;
    }
  `,
  svg: css`
    display: block;
  `,
  point: css`
    fill: var(--openui-background, oklch(0.97 0 89.876 / 1));
  `,
  animated: css`
    @media (prefers-reduced-motion: no-preference) {
      opacity: 0;
      animation: ${fadeAppearAnimation} 0.6s ease-out forwards;
    }
  `,
};
