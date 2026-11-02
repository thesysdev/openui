import { css } from "goober";
import { MODAL } from "../../shared/zIndex";

export const names = {
  root: "openui-dashboard-shell-card",
  size: {
    small: "openui-dashboard-shell-card--size-small",
    medium: "openui-dashboard-shell-card--size-medium",
    large: "openui-dashboard-shell-card--size-large",
  },
  snippet: "openui-dashboard-shell-card--snippet",
  contentWrap: "openui-dashboard-shell-card-content-wrap",
  content: "openui-dashboard-shell-card-content",
  collapseFade: "openui-dashboard-shell-card-collapse-fade",
  collapseControl: "openui-dashboard-shell-card-collapse-control",
  modal: "openui-dashboard-shell-card-modal",
  modalOverlay: "openui-dashboard-shell-card-modal-overlay",
  modalFrame: "openui-dashboard-shell-card-modal-frame",
  modalMinimize: "openui-dashboard-shell-card-modal-minimize",
  modalContent: "openui-dashboard-shell-card-modal-content",
  modalBody: "openui-dashboard-shell-card-modal-body",
} as const;

const PREVIEW_HEIGHT = "--_openui-dashboard-shell-card-preview-height";

/**
 * `&.openui-card` is a wrapper class plus react-components' stable class: Card's root rule sets
 * the same properties and registers later, so a single class here would lose to it.
 */
export const styles = {
  root: css`
    position: relative;
    width: 100%;
    max-width: var(--_openui-dashboard-card-row-card-max-width, 100%);
    min-width: 0;
    min-height: 0;
  `,
  size: {
    small: css`
      flex: var(--_openui-dashboard-card-row-small-flex, 0 1 auto);
      min-width: 220px;
      @media (max-width: 768px) {
        min-width: 100%;
      }
      &.openui-card {
        padding: var(--openui-space-m-l, 16px);
        border-color: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
        border-radius: var(--openui-radius-3xl, 16px);
        background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
      }
    `,
    medium: css`
      ${PREVIEW_HEIGHT}: 240px;
      flex: var(--_openui-dashboard-card-row-medium-flex, 0 1 auto);
      min-width: 360px;
      @media (min-width: 1080px) and (max-width: 1279px) {
        min-width: 320px;
      }
      @media (max-width: 768px) {
        min-width: 100%;
      }
      &.openui-card {
        gap: var(--openui-space-l, 18px);
        padding: var(--openui-space-l, 18px);
        border-color: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
        border-radius: var(--openui-radius-4xl, 20px);
        background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
      }
    `,
    large: css`
      ${PREVIEW_HEIGHT}: 280px;
      flex: var(--_openui-dashboard-card-row-large-flex, 0 1 auto);
      min-width: min(832px, 100%);
      @media (min-width: 1080px) and (max-width: 1279px) {
        min-width: 720px;
      }
      @media (max-width: 1079px) {
        min-width: 100%;
      }
      &.openui-card {
        gap: var(--openui-space-l, 18px);
        padding: var(--openui-space-l, 18px);
        border-color: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
        border-radius: var(--openui-radius-3xl, 16px);
        background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
      }
    `,
  },
  snippet: css`
    &.openui-card {
      align-items: stretch;
      justify-content: center;
    }
  `,
  contentWrap: css`
    position: relative;
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    min-height: 0;
    &[data-collapsed] {
      flex: 0 1 auto;
      max-height: var(${PREVIEW_HEIGHT}, 240px);
      overflow: hidden;
    }
  `,
  content: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-l, 18px);
    width: 100%;
    min-width: 0;
  `,
  collapseFade: css`
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 72px;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      transparent,
      var(--openui-foreground, oklch(0.994 0 89.876 / 1)) 96px
    );
  `,
  collapseControl: css`
    display: flex;
    justify-content: center;
    width: 100%;
  `,
  modal: css`
    position: fixed;
    inset: 0;
    z-index: ${MODAL};
  `,
  modalOverlay: css`
    all: unset;
    position: fixed;
    inset: 0;
    cursor: default;
    background: var(--openui-overlay, oklch(0 0 0 / 0.4));
  `,
  modalFrame: css`
    position: fixed;
    top: 50%;
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--openui-space-s, 8px);
    width: min(1120px, calc(100vw - 48px));
    max-height: calc(100vh - 48px);
    transform: translate(-50%, -50%);
  `,
  modalMinimize: css`
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--openui-radius-m, 8px);
    background: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    box-shadow: var(
      --openui-shadow-s,
      0 1px 3px -2px oklch(0 0 0 / 0.02),
      0 2px 5px -2px oklch(0 0 0 / 0.04)
    );
  `,
  modalContent: css`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: calc(100vh - 96px);
    overflow: hidden;
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: var(--openui-radius-4xl, 20px);
    background: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    box-shadow: var(
      --openui-shadow-xl,
      0 8px 16px -4px oklch(0 0 0 / 0.08),
      0 16px 32px -6px oklch(0 0 0 / 0.12)
    );
  `,
  modalBody: css`
    flex: 1;
    min-height: 0;
    padding: var(--openui-space-l, 18px);
    overflow-y: auto;
  `,
};
