import { css } from "../../styles/css";

const small = `
  font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
  letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;
export const names = {
  trigger: "openui-select-trigger",
  triggerIcon: "openui-select-trigger-icon",
  hideDropdownIcon: { true: "openui-select-trigger--hide-dropdown-icon" },
  value: "openui-select-value",
  content: "openui-select-content",
  viewport: "openui-select-viewport",
  group: "openui-select-group",
  label: "openui-select-label",
  item: "openui-select-item",
  checkWrapper: "openui-select-item-check-wrapper",
  indicator: "openui-select-item-indicator",
  checkIcon: "openui-select-item-check-icon",
  itemText: "openui-select-item-text",
  textValue: "openui-select-item-text-value",
  separator: "openui-select-separator",
  showTick: { true: "openui-select-item--show-tick" },
  position: {
    popper: "openui-select-content--position-popper",
    "item-aligned": "openui-select-content--position-item-aligned",
  },
  contentSize: {
    sm: "openui-select-content--size-sm",
    md: "openui-select-content--size-md",
    lg: "openui-select-content--size-lg",
  },
  size: {
    sm: "openui-select-trigger--size-sm",
    md: "openui-select-trigger--size-md",
    lg: "openui-select-trigger--size-lg",
  },
} as const;

const contentText = `
  font: var(--_openui-select-content-font, var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif));
  letter-spacing: var(--_openui-select-content-letter-spacing, var(--openui-text-body-default-letter-spacing, -0.01em));
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;

export const selectStyles = {
  trigger: css`
    --_openui-select-trigger-icon-transform: none;
    --_openui-select-trigger-hover-color: initial;
    box-sizing: border-box;
    background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    outline: none;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-s, 8px);
    :where(&) {
      svg {
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        transform: var(--_openui-select-trigger-icon-transform, none);
      }
    }
    &:hover {
      --_openui-select-trigger-hover-color: var(
        --openui-text-neutral-primary,
        oklch(0.097 0 0 / 1)
      );
      background: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
      border-color: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
    }
    &[data-state="open"] {
      --_openui-select-trigger-icon-transform: rotate(180deg);
      border-color: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
      background-color: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
    }
    &:disabled {
      background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
      /* react-ui's selected hover colour outweighs disabled; placeholder below still wins.
         A variable preserves that precedence without a compound state selector. */
      color: var(
        --_openui-select-trigger-hover-color,
        var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2))
      );
      border-color: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
      cursor: not-allowed;
    }
    &[data-placeholder] {
      color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    }
  `,
  triggerIcon: css`
    height: 16px;
    width: 16px;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    transform: var(--_openui-select-trigger-icon-transform, none);
  `,
  size: {
    sm: css`
      ${small}
      padding: calc(var(--openui-space-xs, 6px) - 1.5px) var(--openui-space-s, 8px);
      border-radius: calc(var(--openui-radius-s, 6px) + 1px);
    `,
    md: css`
      padding: calc(var(--openui-space-xs, 6px) - 1px) calc(var(--openui-space-m, 12px) - 1px);
      border-radius: var(--openui-radius-m, 8px);
    `,
    lg: css`
      padding: calc(var(--openui-space-s, 8px) - 1px) var(--openui-space-m, 12px);
      border-radius: var(--openui-radius-l, 10px);
    `,
  },

  content: css`
    box-sizing: border-box;
    position: relative;
    display: flex;
    flex-direction: column;
    outline: none;
    z-index: 99999;
    max-height: var(--_openui-select-content-max-height);
    min-width: var(--radix-select-trigger-width);
    overflow: hidden;
    border: none;
    border-radius: var(--openui-radius-2xl, 14px);
    background-color: color-mix(
      in oklch,
      var(--openui-foreground, oklch(0.994 0 89.876 / 1)),
      var(--openui-text-white, oklch(1 0 89.876 / 1)) 6%
    );
    box-shadow:
      0 0 0 1px
        color-mix(
          in oklch,
          var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1)) 6%,
          transparent
        ),
      0 4px 12px -2px oklch(0 0 0 / 0.05),
      0 16px 32px -8px oklch(0 0 0 / 0.08);
    padding: 0;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    transform-origin: top center;
    animation: _openui-select-show 0.18s ease-out forwards;
    @keyframes _openui-select-show {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `,
  position: {
    popper: css`
      --_openui-select-viewport-width: 100%;
      --_openui-select-content-max-height: 372px;
    `,
    "item-aligned": css`
      --_openui-select-viewport-width: auto;
      --_openui-select-content-max-height: 100%;
    `,
  },
  contentSize: {
    sm: css`
      --_openui-select-content-font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
      --_openui-select-content-letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
      --_openui-select-label-font-size: 14px;
      --_openui-select-label-line-height: 1.5;
    `,
    md: css`
      --_openui-select-content-font: var(
        --openui-text-body-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-select-content-letter-spacing: var(
        --openui-text-body-default-letter-spacing,
        -0.01em
      );
      --_openui-select-label-font-size: 12px;
      --_openui-select-label-line-height: 12px;
    `,
    lg: css`
      --_openui-select-content-font: var(
        --openui-text-body-default,
        400 16px/1.5 "Inter",
        sans-serif
      );
      --_openui-select-content-letter-spacing: var(
        --openui-text-body-default-letter-spacing,
        -0.01em
      );
      --_openui-select-label-font-size: 12px;
      --_openui-select-label-line-height: 12px;
    `,
  },
  viewport: css`
    position: relative;
    flex: 1;
    overflow: hidden auto;
    box-sizing: border-box;
    padding: var(--openui-space-2xs, 4px) 0;
    border-bottom-left-radius: calc(var(--openui-radius-2xl, 14px) - var(--openui-space-2xs, 4px));
    border-bottom-right-radius: calc(var(--openui-radius-2xl, 14px) - var(--openui-space-2xs, 4px));
    width: var(--_openui-select-viewport-width, auto);
  `,
  group: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-3xs, 2px);
  `,
  label: css`
    box-sizing: border-box;
    ${contentText}
    padding: var(--openui-space-s, 8px) var(--openui-space-m-l, 16px) var(--openui-space-2xs, 4px);
    color: color-mix(
      in oklch,
      var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1)) 60%,
      transparent
    );
    font-size: var(--_openui-select-label-font-size, 12px);
    line-height: var(--_openui-select-label-line-height, 12px);
  `,
  item: css`
    box-sizing: border-box;
    position: relative;
    display: flex;
    cursor: default;
    user-select: none;
    align-items: center;
    justify-content: space-between;
    ${contentText}
    height: 32px;
    padding: 0 var(--openui-space-m-l, 16px);
    border-radius: 0;
    outline: none;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    &:hover {
      background-color: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    }
    &:focus-within {
      background-color: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    }
    &[data-highlighted] {
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    }
    &[data-state="checked"] {
      background-color: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
    }
    &[data-disabled] {
      pointer-events: none;
      opacity: 0.5;
    }
  `,
  showTick: css`
    padding-right: var(--openui-space-xl, 24px);
  `,
  checkWrapper: css`
    position: absolute;
    right: 8px;
    height: 14px;
    width: 14px;
  `,
  checkIcon: css`
    height: 16px;
    width: 16px;
  `,
  separator: css`
    box-sizing: border-box;
    margin: var(--openui-space-2xs, 4px) 0;
    height: 1px;
    border-top: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
  `,
};
