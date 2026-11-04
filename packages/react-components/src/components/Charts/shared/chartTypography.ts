export const svgTickTypography = `
  font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
  letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;

export const svgTickLabel = `
  ${svgTickTypography}
  fill: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
`;
