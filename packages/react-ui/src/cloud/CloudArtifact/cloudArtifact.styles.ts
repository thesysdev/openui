import { css, keyframes } from "@openuidev/react-components";
import { easeOut, phone, typography } from "../shared.styles";

const bodyHeavy = typography("openui-text-body-default-heavy", "medium");
const bodySmall = typography("openui-text-body-sm", "regular");
const labelSmall = typography("openui-text-label-sm", "regular");

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const shimmer = keyframes`
  from {
    background-position: 100% 0;
  }
  to {
    background-position: 0% 0;
  }
`;

/** Stable class names, to target from your own CSS. */
export const names = {
  root: "openui-artifact",
  preview: "openui-artifact-preview",
  previewText: "openui-artifact-preview-text",
  previewTitle: "openui-artifact-preview-title",
  previewDescription: "openui-artifact-preview-description",
  loader: "openui-artifact-loader",
  loaderText: "openui-artifact-loader-text",
  spinner: "openui-artifact-spinner",
  edited: "openui-artifact-edited",
  chrome: "openui-artifact-chrome",
  chromeBar: "openui-artifact-chrome-bar",
  chromeTitle: "openui-artifact-chrome-title",
  chromeActions: "openui-artifact-chrome-actions",
  close: "openui-artifact-close",
  content: "openui-artifact-content",
  loading: "openui-artifact-loading",
  loadingEmpty: "openui-artifact-loading-empty",
  pending: "openui-artifact-pending",
  error: "openui-artifact-error",
  errorEmpty: "openui-artifact-error-empty",
  panel: "openui-artifact-panel",
  inspecting: "openui-artifact-inspecting",
  provenanceToggle: "openui-artifact-provenance-toggle",
  provenanceDot: "openui-artifact-provenance-dot",
  allQueries: "openui-artifact-all-queries",
} as const;

export const styles = {
  root: css`
    position: relative;
  `,
  preview: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-s);
    box-sizing: border-box;
    width: 100%;
    margin: var(--openui-space-xs) 0;
    padding: var(--openui-space-s) var(--openui-space-m);
    border: 1px solid var(--openui-border-default);
    border-radius: var(--openui-radius-m);
    background: transparent;
    color: var(--openui-text-neutral-primary);
    text-align: left;
    cursor: pointer;
    transition: background-color 0.12s ease;
    &:hover {
      background: var(--openui-elevated-light);
    }
  `,
  previewText: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-3xs);
    min-width: 0;
  `,
  previewTitle: css`
    ${bodyHeavy}
  `,
  previewDescription: css`
    ${bodySmall}
    color: var(--openui-text-neutral-secondary);
  `,
  loader: css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--openui-space-2xs);
    ${labelSmall}
    color: var(--openui-text-neutral-secondary);
  `,
  spinner: css`
    animation: ${spin} 0.9s linear infinite;
  `,
  // A brighter band sweeps across dimmed text. The fill is transparent, not the color, so
  // `currentColor` in the gradient stays the loader's text color.
  shimmer: css`
    background: linear-gradient(
        90deg,
        color-mix(in srgb, currentColor 45%, transparent) 35%,
        currentColor 50%,
        color-mix(in srgb, currentColor 45%, transparent) 65%
      )
      0 0 / 250% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ${shimmer} 2s linear infinite;
    @media (prefers-reduced-motion: reduce) {
      animation: none;
      background: none;
      -webkit-text-fill-color: currentColor;
    }
  `,
  chrome: css`
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 1px solid var(--openui-border-default);
    border-radius: var(--openui-radius-m);
    background: var(--openui-background);
    color: var(--openui-text-neutral-primary);
  `,
  chromeBar: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-s);
    padding: var(--openui-space-xs) var(--openui-space-m);
    border-bottom: 1px solid var(--openui-border-default);
  `,
  chromeTitle: css`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    ${bodyHeavy}
  `,
  chromeActions: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-xs);
  `,
  // Inspect mode: every data-bound component is outlined, dotted, in the accent color at 60%. The
  // one under the pointer, the focused one and the pick are solid. Rules in `:where()` count for
  // nothing, so an app's own rule overrides them (see the docs). The `--openui-inspect-*`
  // variables, set on any element around the content, restyle them. Drawn outside the element, so
  // its own content (a table's row and header fills) can't paint over them. Only a fine pointer
  // gets the hover outline: on a touch screen it would stick after a tap.
  inspecting: css`
    & :where([data-openui-bound]) {
      cursor: pointer;
      outline: var(
        --openui-inspect-outline,
        2px dotted
          color-mix(
            in oklch,
            var(--openui-inspect-color, var(--openui-interactive-accent-default)) 60%,
            transparent
          )
      );
      outline-offset: var(--openui-inspect-outline-offset, 4px);
      transition: outline-color 120ms ease;
    }
    @media (hover: hover) and (pointer: fine) {
      & :where([data-openui-bound][data-openui-hover]) {
        outline: var(
          --openui-inspect-active-outline,
          2px solid var(--openui-inspect-color, var(--openui-interactive-accent-default))
        );
      }
    }
    /* The focus ring: a solid outline, as under the pointer. */
    & :where([data-openui-bound]):focus-visible {
      outline: var(
        --openui-inspect-active-outline,
        2px solid var(--openui-inspect-color, var(--openui-interactive-accent-default))
      );
    }
  `,
  content: css`
    position: relative;
    flex: 1;
    min-height: 120px;
    overflow: auto;
    /*
     * The pick stays solid. Given focus back when the dialog closes, it keeps this outline rather
     * than the page's focus ring: with :focus-visible outside :where(), the rule outranks a page's
     * own :focus-visible one.
     */
    & :where([data-openui-selected]),
    & :where([data-openui-selected]):focus-visible {
      outline: var(
        --openui-inspect-active-outline,
        2px solid var(--openui-inspect-color, var(--openui-interactive-accent-default))
      );
      outline-offset: var(--openui-inspect-outline-offset, 4px);
    }
  `,
  loading: css`
    position: absolute;
    top: var(--openui-space-xs);
    right: var(--openui-space-xs);
    display: inline-flex;
    align-items: center;
    gap: var(--openui-space-2xs);
    padding: var(--openui-space-3xs) var(--openui-space-s);
    border: 1px solid var(--openui-border-default);
    border-radius: var(--openui-radius-full);
    background: var(--openui-background);
    box-shadow: var(--openui-shadow-s);
    ${labelSmall}
    color: var(--openui-text-neutral-secondary);
  `,
  // Nothing to show yet: center the loader in the empty content.
  loadingEmpty: css`
    inset: 0;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  `,
  error: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-s);
    margin: var(--openui-space-s);
    padding: var(--openui-space-s) var(--openui-space-m);
    border: 1px solid var(--openui-border-danger);
    border-radius: var(--openui-radius-m);
    background: var(--openui-danger-background);
    ${bodySmall}
  `,
  errorEmpty: css`
    position: absolute;
    inset: 0;
    width: fit-content;
    max-width: calc(100% - 2 * var(--openui-space-l));
    height: fit-content;
    margin: auto;
  `,
  panel: css`
    padding: var(--openui-space-l) var(--openui-space-xl);
  `,
};

// ─── Sources toggle and All queries ──────────────────────────────────────

/*
 * The Sources toggle's own pressed look, over the tertiary button: a highlight fill, a 1px inset
 * ring and an accent dot on the icon. On takes 120ms (the dot 150ms, growing from half size);
 * off is instant, so the transitions sit on the "on" state only. Reduced motion keeps fades.
 * `&&` ties with the button's own hover and active rules, which set the same fill.
 */
export const toggleStyles = {
  toggle: css`
    && {
      transition: none;
    }
    &&[data-state="on"] {
      background-color: var(--openui-highlight);
      box-shadow: inset 0 0 0 1px var(--openui-border-default);
      transition:
        background-color 120ms ease,
        box-shadow 120ms ease;
    }
    @media ${phone} {
      min-height: 44px;
    }
  `,
  icon: css`
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
  `,
  dot: css`
    position: absolute;
    top: -2px;
    right: -2px;
    width: 6px;
    height: 6px;
    border-radius: var(--openui-radius-full);
    background: var(--openui-interactive-accent-default);
    box-shadow: 0 0 0 1.5px var(--openui-background);
    opacity: 0;
    transform: scale(0.5);
    pointer-events: none;
    .${names.provenanceToggle}[data-state="on"] & {
      opacity: 1;
      transform: scale(1);
      transition:
        opacity 150ms ${easeOut},
        transform 150ms ${easeOut};
    }
    @media (prefers-reduced-motion: reduce) {
      transform: none;
      .${names.provenanceToggle}[data-state="on"] & {
        transform: none;
        transition: opacity 150ms;
      }
    }
  `,
  // Comes out of the toggle beside it: a fade and a 4px slide from its right edge. It leaves at
  // once, as turning Sources off does.
  allQueries: css`
    && {
      transform-origin: right center;
      @media (prefers-reduced-motion: no-preference) {
        transition:
          background-color 120ms ease,
          opacity 150ms ${easeOut},
          transform 150ms ${easeOut};
        @starting-style {
          opacity: 0;
          transform: translateX(4px) scale(0.96);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        transition: opacity 150ms;
        @starting-style {
          opacity: 0;
        }
      }
    }
    @media ${phone} {
      min-width: 44px;
      min-height: 44px;
    }
  `,
};
