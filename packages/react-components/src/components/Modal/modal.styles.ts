import { css } from "../../styles/css";

export const names = {
  root: "openui-modal",
  overlay: "openui-modal-overlay",
  content: "openui-modal-content",
  header: "openui-modal-header",
  title: "openui-modal-title",
  close: "openui-modal-close",
  body: "openui-modal-body",
  closeIcon: "openui-modal-close-icon",
  size: { sm: "openui-modal--size-sm", md: "openui-modal--size-md", lg: "openui-modal--size-lg" },
} as const;
export const modalStyles = {
  root: css`
    position: relative;
    z-index: 9999;
  `,
  overlay: css`
    position: fixed;
    inset: 0;
    background: var(--openui-overlay, oklch(0 0 0 / 0.4));
    z-index: 9999;
    animation: _openui-modal-fade-in 0.15s ease-out;
    @keyframes _openui-modal-fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
  content: css`
    /* react-ui's content-box sizing, declared so a page's box-sizing reset (Tailwind's preflight, for
       one) cannot change the geometry. */
    box-sizing: content-box;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    background: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    max-height: 85vh;
    animation: _openui-modal-slide-in 0.15s ease-out;
    outline: none;
    width: var(--_openui-modal-content-width);
    max-width: 90vw;
    @keyframes _openui-modal-slide-in {
      from {
        opacity: 0;
        transform: translate(-50%, -48%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--openui-space-m, 12px);
    border-bottom: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
  `,
  title: css`
    font: var(--openui-text-body-default-heavy, 560 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-heavy-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-medium, "wght" 560);
    margin: 0;
  `,
  close: css`
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    &:hover {
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    }
  `,
  body: css`
    padding: var(--openui-space-m, 12px);
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-m, 12px);
  `,
  closeIcon: css`
    width: 18px;
    height: 18px;
  `,
  size: {
    sm: css`
      --_openui-modal-content-width: 400px;
    `,
    md: css`
      --_openui-modal-content-width: 560px;
    `,
    lg: css`
      --_openui-modal-content-width: 720px;
    `,
  },
};
