import { css } from "../../styles/css";

/** TabsList's stable classes. The tablist is the root: it receives `className`, `style` and `ref`. */
export const names = {
  root: "openui-tabs-list",
  container: "openui-tabs-list-container",
  indicator: "openui-tabs-indicator",
  scrollButtonContainerLeft: "openui-tabs-scroll-button-container-left",
  scrollButtonContainerRight: "openui-tabs-scroll-button-container-right",
  scrollButton: "openui-tabs-scroll-button",
  scrollLeft: "openui-tabs-scroll-left",
  scrollRight: "openui-tabs-scroll-right",
  variant: {
    title: "openui-tabs-list--variant-title",
    iconTitle: "openui-tabs-list--variant-icon-title",
    iconTitleSubtext: "openui-tabs-list--variant-icon-title-subtext",
    imageTitle: "openui-tabs-list--variant-image-title",
    imageTitleSubtext: "openui-tabs-list--variant-image-title-subtext",
  },
} as const;

const radiusS = `var(--openui-radius-s, 6px)`;
const radiusM = `var(--openui-radius-m, 8px)`;
const triggerPaddingS = `var(--openui-space-s, 8px) 0`;
const triggerPaddingM = `var(--openui-space-m, 12px) 0`;

/**
 * Each list variant sets the private `--_openui-tabs-trigger-*` variables its triggers read for
 * padding, alignment and icon/image geometry, so a variant reaches the trigger parts without a
 * descendant selector. Every variant sets every variable, so nested lists do not inherit them.
 */
const triggerGeometry = (values: {
  padding: string;
  align: string;
  contentAlign: string;
  iconSize: string;
  iconRadius: string;
  iconSvgSize: string;
  imageSize: string;
  imageRadius: string;
}) => `
  --_openui-tabs-trigger-padding: ${values.padding};
  --_openui-tabs-trigger-align: ${values.align};
  --_openui-tabs-trigger-content-align: ${values.contentAlign};
  --_openui-tabs-trigger-icon-size: ${values.iconSize};
  --_openui-tabs-trigger-icon-radius: ${values.iconRadius};
  --_openui-tabs-trigger-icon-svg-size: ${values.iconSvgSize};
  --_openui-tabs-trigger-image-size: ${values.imageSize};
  --_openui-tabs-trigger-image-radius: ${values.imageRadius};
`;

const scrollButtonContainer = `
  position: absolute;
  height: 100%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
`;

// The scroll buttons are IconButtons, whose own root rules already set the display, alignment and
// cursor these parts used to repeat, so the parts carry no rules of their own.
export const tabsListStyles = {
  root: css`
    width: 100%;
    box-sizing: border-box;
    display: flex;
    gap: var(--openui-space-l, 18px);
    flex-direction: row;
    padding: 0;
    border-radius: 0;
    background: none;
    flex: 1;
    position: relative;
    overflow-x: auto;
    scrollbar-width: none;
    scroll-behavior: smooth;
    &::-webkit-scrollbar {
      display: none;
    }
  `,
  container: css`
    position: relative;
    display: flex;
    align-items: center;
    overflow: hidden;
    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      height: 1px;
      left: 0;
      right: 0;
      border-bottom: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
      pointer-events: none;
    }
  `,
  // Width, offset and opacity are set inline by TabsList as the active trigger changes.
  indicator: css`
    position: absolute;
    bottom: 0;
    left: 0;
    height: 1.5px;
    width: 0;
    opacity: 0;
    background-color: var(--openui-border-interactive-selected, oklch(0.097 0 0 / 1));
    pointer-events: none;
    z-index: 1;
  `,
  scrollButtonContainerLeft: css`
    ${scrollButtonContainer}
    left: 0;
    padding: 0 4px 0 0;
  `,
  scrollButtonContainerRight: css`
    ${scrollButtonContainer}
    right: 0;
    padding: 0 0 0 4px;
  `,
  variant: {
    title: css`
      ${triggerGeometry({
        padding: triggerPaddingS,
        align: "center",
        contentAlign: "center",
        iconSize: "24px",
        iconRadius: "0",
        iconSvgSize: "14px",
        imageSize: "24px",
        imageRadius: "0",
      })}
    `,
    iconTitle: css`
      ${triggerGeometry({
        padding: triggerPaddingS,
        align: "center",
        contentAlign: "flex-start",
        iconSize: "24px",
        iconRadius: radiusS,
        iconSvgSize: "14px",
        imageSize: "24px",
        imageRadius: "0",
      })}
    `,
    iconTitleSubtext: css`
      ${triggerGeometry({
        padding: triggerPaddingM,
        align: "flex-start",
        contentAlign: "flex-start",
        iconSize: "36px",
        iconRadius: radiusM,
        iconSvgSize: "16px",
        imageSize: "24px",
        imageRadius: "0",
      })}
    `,
    imageTitle: css`
      ${triggerGeometry({
        padding: triggerPaddingS,
        align: "center",
        contentAlign: "flex-start",
        iconSize: "24px",
        iconRadius: radiusS,
        iconSvgSize: "14px",
        imageSize: "24px",
        imageRadius: radiusS,
      })}
    `,
    imageTitleSubtext: css`
      ${triggerGeometry({
        padding: triggerPaddingM,
        align: "flex-start",
        contentAlign: "flex-start",
        iconSize: "24px",
        iconRadius: "0",
        iconSvgSize: "14px",
        imageSize: "36px",
        imageRadius: radiusM,
      })}
    `,
  },
};
