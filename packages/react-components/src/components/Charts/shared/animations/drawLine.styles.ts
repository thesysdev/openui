import { css } from "../../../../styles/css";

// The stable animation name and its keyframes are available on import.
export const drawLineStyles = css`
  @keyframes openui-chart-draw-line {
    to {
      stroke-dashoffset: 0;
    }
  }
`;

export const drawLineAnimation = drawLineStyles && "openui-chart-draw-line";
