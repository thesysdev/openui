import { css, keyframes } from "@openuidev/react-components";

const trace = keyframes`
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const noMotion = `
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const pendingLoaderStyles = {
  // The sketch is `--openui-pending-color`, by default the text color it inherits (not a theme
  // token, so it follows the page even outside a ThemeProvider), at a low strength.
  root: css`
    --openui-pending-tint: var(--openui-pending-color, currentColor);
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    /* Fills a content area with a height, even a short one; on a page without one, the stage sets it. */
    height: 100%;
  `,
  // A flex item, not `height: 100%`, which a page without a height can't resolve: there the
  // basis gives the root a dashboard's 400px.
  stage: css`
    position: relative;
    flex: 1 1 400px;
    width: 100%;
    min-height: 0;
    overflow: hidden;
  `,
  // Where the dashboard's content will be. It runs past the bottom, as a dashboard would.
  sketch: css`
    position: absolute;
    top: var(--openui-space-l);
    right: var(--openui-space-l);
    left: var(--openui-space-l);
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1368px;
    margin: 0 auto;
    color: color-mix(in srgb, var(--openui-pending-tint) 28%, transparent);
    pointer-events: none;
    user-select: none;
    transition: opacity 0.9s ease-out;
  `,
  hidden: css`
    opacity: 0;
  `,
  traced: css`
    stroke-dashoffset: 1;
    animation: ${trace} 1.6s cubic-bezier(0.65, 0, 0.35, 1) both;
    @media (prefers-reduced-motion: reduce) {
      animation: none;
      stroke-dashoffset: 0;
    }
  `,
  fades: css`
    animation: ${fadeIn} 0.7s ease-out both;
    ${noMotion}
  `,
  box: css`
    position: relative;
    box-sizing: border-box;
    min-width: 0;
    & > svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
  `,
  // Small round dots where text will be.
  line: css`
    display: block;
    height: 3px;
    max-width: 100%;
    background-image: radial-gradient(circle, currentColor 0.75px, transparent 1.15px);
    background-size: 5px 3px;
    background-repeat: repeat-x;
  `,
  widget: css`
    position: relative;
    box-sizing: border-box;
    min-width: 0;
  `,
  inside: css`
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-sizing: border-box;
    height: 100%;
    padding: 20px;
    color: color-mix(in srgb, var(--openui-pending-tint) 20%, transparent);
  `,
  strong: css`
    color: color-mix(in srgb, var(--openui-pending-tint) 30%, transparent);
  `,
  row: css`
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
  `,
  // The feed, a fifth of the way down, over the sketch.
  overlay: css`
    position: absolute;
    inset: 22% 0 auto;
    z-index: 5;
    display: flex;
    justify-content: center;
    padding: 0 var(--openui-space-m);
    pointer-events: none;
  `,
  // A custom label: the renderer's loading pill, over the sketch.
  note: css`
    display: inline-flex;
    align-items: center;
    gap: var(--openui-space-2xs);
    box-sizing: border-box;
    max-width: 100%;
    padding: var(--openui-space-2xs) var(--openui-space-s);
    border: 1px solid var(--openui-border-default);
    border-radius: var(--openui-radius-full);
    background: var(--openui-background);
    box-shadow: var(--openui-shadow-s);
    color: var(--openui-text-neutral-secondary);
    font-size: 0.875rem;
    line-height: 1.2;
    white-space: nowrap;
    & > svg {
      flex-shrink: 0;
    }
  `,
};
