import { css, keyframes } from "goober";
import { tokens } from "../../shared/tokens";

const shimmer = keyframes`
  from {
    background-position: 120% 0;
  }
  to {
    background-position: -120% 0;
  }
`;

export const names = {
  root: "openui-intelligent-photo",
  contain: "openui-intelligent-photo--fit-contain",
  image: "openui-intelligent-photo-image",
  empty: "openui-intelligent-photo-empty",
} as const;

/** A shimmer until the photo loads; none once there is nothing to wait for. */
export const styles = {
  root: css`
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    background: ${tokens.photoEmpty};
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(100deg, transparent 30%, color-mix(in srgb, ${tokens.canvas} 55%, transparent) 50%, transparent 70%) 0 0 / 220% 100%;
      animation: ${shimmer} 1.4s linear infinite;
    }
    &[data-state="loaded"]::before {
      content: none;
    }
    &[data-state="empty"]::before {
      display: none;
    }
    &[data-state="loaded"] {
      --_openui-intelligent-photo-opacity: 1;
    }
    @media (prefers-reduced-motion: reduce) {
      &::before {
        animation: none;
      }
    }
  `,
  contain: css`
    --_openui-intelligent-photo-fit: contain;
  `,
  image: css`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: var(--_openui-intelligent-photo-fit, cover);
    opacity: var(--_openui-intelligent-photo-opacity, 0);
    transition: opacity 0.3s ease;
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
  empty: css`
    width: 26px;
    height: 26px;
    color: ${tokens.photoEmptyIcon};
  `,
};
