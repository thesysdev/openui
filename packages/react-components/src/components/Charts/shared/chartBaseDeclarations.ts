// Concrete declarations shared by the existing chart-base SCSS mixins.
export const cartesianContainer = `
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
export const cartesianContainerInner = `
  display: flex;
  width: 100%;
  flex: 1;
  min-height: 0;
`;
export const cartesianYAxisContainer = `
  flex-shrink: 0;
`;
export const cartesianMainContainer = `
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
  ms-overflow-style: none;
`;
export const centeredContainer = `
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  position: relative;
`;
export const centeredSvgWrapper = `
  display: flex;
  justify-content: center;
  align-items: center;
`;
export const gridLine = `
  stroke: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
  stroke-dasharray: 3 3;
`;
export const zeroGridLine = `
  stroke-dasharray: none;
`;
export const activeDotOuter = `
  fill: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
  stroke: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
  stroke-width: 1;
`;
export const activeDotInner = `
  stroke: none;
`;
export const crosshairLine = `
  stroke: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
  stroke-width: 1;
  stroke-dasharray: 4 4;
`;
