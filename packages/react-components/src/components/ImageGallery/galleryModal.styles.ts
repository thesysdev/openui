import { css } from "../../styles/css";

export const names = {
  modal: "openui-image-gallery-modal",
  content: "openui-image-gallery-modal-content",
  header: "openui-image-gallery-modal-header",
  heading: "openui-image-gallery-modal-heading",
  main: "openui-image-gallery-modal-main",
  carouselContainer: "openui-image-gallery-modal-carousel-container",
  carousel: "openui-image-gallery-modal-carousel",
  buttonContainer: "openui-image-gallery-modal-button-container",
  leftButton: "openui-image-gallery-modal-left-button",
  rightButton: "openui-image-gallery-modal-right-button",
  thumbnail: "openui-image-gallery-modal-thumbnail",
  mainImage: "openui-image-gallery-modal-main-image",
  thumbnailImage: "openui-image-gallery-modal-thumbnail-image",
  close: "openui-image-gallery-modal-close",
  scrollLeft: "openui-image-gallery-modal-scroll-left",
  scrollRight: "openui-image-gallery-modal-scroll-right",
  icon: "openui-image-gallery-modal-icon",
} as const;
export const galleryModalStyles = {
  modal: css`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: _openui-image-gallery-fade-in 0.3s ease;
    backdrop-filter: blur(3px);
    background-color: var(--openui-overlay, oklch(0 0 0 / 0.4));
    @keyframes _openui-image-gallery-fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
  content: css`
    width: calc(100% - 80px);
    height: calc(100% - 80px);
    max-width: 720px;
    max-height: 640px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    border-radius: var(--openui-radius-xl, 12px);
    gap: var(--openui-space-xl, 24px);
    padding-top: var(--openui-space-xl, 24px);
    padding-bottom: var(--openui-space-xl, 24px);
    @media (max-width: 768px) {
      width: 100%;
      height: 100%;
      border-radius: 0;
      max-height: none;
      max-width: none;
    }
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: var(--openui-space-xl, 24px);
    padding-right: var(--openui-space-xl, 24px);
  `,
  heading: css`
    font: var(--openui-text-heading-xs, 600 16px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-heading-xs-letter-spacing, -0.01em);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  main: css`
    flex: 1;
    min-height: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-left: var(--openui-space-xl, 24px);
    padding-right: var(--openui-space-xl, 24px);
  `,
  carouselContainer: css`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  `,
  carousel: css`
    display: flex;
    gap: var(--openui-space-s, 8px);
    overflow-x: auto;
    scroll-behavior: smooth;
    scrollbar-width: none;
    padding-left: var(--openui-space-xl, 24px);
    padding-right: var(--openui-space-xl, 24px);
    &::-webkit-scrollbar {
      display: none;
    }
  `,
  buttonContainer: css`
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    border-radius: var(--openui-radius-xs, 4px);
    overflow: hidden;
  `,
  leftButton: css`
    left: 24px;
  `,
  rightButton: css`
    right: 24px;
  `,
  thumbnail: css`
    flex: 1;
    height: 116px;
    min-width: 174px;
    cursor: pointer;
    opacity: 0.6;
    border-radius: var(--openui-radius-s, 6px);
    border: 1px solid transparent;
    overflow: hidden;
    transition: opacity 0.2s ease;
    box-sizing: border-box;
    &[aria-pressed="true"] {
      opacity: 1;
      border-color: var(--openui-border-interactive-selected, oklch(0.097 0 0 / 1));
      border-radius: var(--openui-radius-s, 6px);
    }
    &:hover {
      opacity: 0.8;
    }
  `,
  mainImage: css`
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: var(--openui-radius-s, 6px);
  `,
  thumbnailImage: css`
    width: 100%;
    height: 100%;
    object-fit: cover;
  `,
};
