import { css } from "../../styles/css";
import { inputStyles } from "../Input/input.styles";
import { selectStyles } from "../Select/select.styles";

// Reading the maps retains value imports, registering composed defaults before owned overrides.
Object.values(inputStyles);
Object.values(selectStyles);

export const names = {
  root: "openui-slider-block",
  variant: {
    continuous: "openui-slider-block--variant-continuous",
    discrete: "openui-slider-block--variant-discrete",
  },
  header: "openui-slider-block-header",
  label: "openui-slider-block-label",
  controls: "openui-slider-block-controls",
  content: "openui-slider-block-content",
  inputContainer: "openui-slider-block-validated-input-container",
  selectContainer: "openui-slider-block-validated-select-container",
  validatedInput: "openui-slider-block-validated-input",
  input: "openui-slider-block-input",
  selectTrigger: "openui-slider-block-select-trigger",
  error: "openui-slider-block-error-message",
  errorIcon: "openui-slider-block-error-icon",
  separator: "openui-slider-block-separator",
} as const;

export const sliderBlockStyles = {
  root: css`
    width: 100%;
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: calc(var(--openui-space-s, 8px) + var(--openui-space-xs, 6px));
    &[data-invalid="true"] {
      align-items: flex-start;
      margin-bottom: var(--openui-space-s, 8px);
    }
  `,
  label: css`
    font: var(--openui-text-label-default, 400 16px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    padding-top: var(--openui-space-xs, 6px);
  `,
  controls: css`
    display: flex;
    gap: var(--openui-space-xs, 6px);
    position: relative;
    flex-direction: column;
    align-items: flex-end;
    --_openui-slider-block-input-width: 80px;
    --_openui-slider-block-select-width: 100px;
    &[data-range] {
      --_openui-slider-block-input-width: 64px;
      --_openui-slider-block-select-width: 80px;
    }
  `,
  content: css`
    display: flex;
    align-items: center;
  `,
  controlContainer: css`
    display: flex;
    gap: var(--openui-space-xs, 6px);
    align-items: center;
  `,
  validatedInput: css`
    position: relative;
  `,
  error: css`
    display: flex;
    gap: var(--openui-space-2xs, 4px);
    align-items: center;
    font: var(--openui-text-label-sm, 400 14px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-danger-primary, oklch(0.505 0.19 27.518 / 1));
    white-space: nowrap;
    padding-right: var(--openui-space-2xs, 4px);
  `,
  separator: css`
    width: 8px;
    height: 2px;
    background-color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    flex-shrink: 0;
  `,
};

// Registered after the composed Input defaults, so a single owned class wins the tie. The error
// state is Input's own `[aria-invalid]`, so Input's state overrides reach it. As in react-ui it keeps
// the danger border even when disabled, draws no danger ring, and keeps the focus ring.
export const sliderBlockInputStyles = {
  input: css`
    height: 36px;
    width: var(--_openui-slider-block-input-width, 80px);
    text-align: right;
    padding-left: var(--openui-space-s, 8px);
    padding-right: var(--openui-space-s, 8px);
    &[aria-invalid="true"] {
      border-color: var(--openui-border-danger-emphasis, oklch(0.577 0.215 27.325 / 1));
      box-shadow: none;
    }
    &:focus-within {
      box-shadow: 0 0 0 2.5px var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    }
  `,
};

// Registered after Select's defaults, as Calendar does.
export const sliderBlockSelectStyles = {
  trigger: css`
    height: 36px;
    width: var(--_openui-slider-block-select-width, 100px);
  `,
};
