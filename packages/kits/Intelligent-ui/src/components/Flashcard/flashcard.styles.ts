import { css } from "goober";
import { tokens } from "../../shared/tokens";

const FACE_BORDER = "--_openui-intelligent-flashcard-face-border";
const FLIP = "--_openui-intelligent-flashcard-flip";

export const names = {
  root: "openui-intelligent-flashcard",
  inner: "openui-intelligent-flashcard-inner",
  face: "openui-intelligent-flashcard-face",
  side: { front: "openui-intelligent-flashcard-face--side-front", back: "openui-intelligent-flashcard-face--side-back" },
  word: "openui-intelligent-flashcard-word",
  hint: "openui-intelligent-flashcard-hint",
} as const;

export const styles = {
  root: css`
    display: block;
    width: 100%;
    min-height: 168px;
    padding: 0;
    border: 0;
    background: none;
    color: ${tokens.ink};
    font: inherit;
    text-align: center;
    cursor: pointer;
    perspective: 900px;
    &:hover {
      ${FACE_BORDER}: ${tokens.borderStrong};
    }
    &[aria-pressed="true"] {
      ${FLIP}: rotateY(180deg);
    }
    &:focus-visible {
      outline: 2px solid ${tokens.focus};
      outline-offset: 3px;
      border-radius: ${tokens.radiusXl};
    }
  `,
  inner: css`
    position: relative;
    display: grid;
    width: 100%;
    height: 100%;
    min-height: inherit;
    transform: var(${FLIP}, none);
    transition: transform 0.45s cubic-bezier(0.3, 0.7, 0.3, 1);
    transform-style: preserve-3d;
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
  face: css`
    grid-area: 1 / 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px 18px 30px;
    border: 1px solid var(${FACE_BORDER}, ${tokens.border});
    border-radius: ${tokens.radiusXl};
    background: var(--_openui-intelligent-flashcard-face-background, ${tokens.canvas});
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  `,
  back: css`
    --_openui-intelligent-flashcard-face-background: ${tokens.surface};
    --_openui-intelligent-flashcard-word-size: 16px;
    --_openui-intelligent-flashcard-word-weight: 560;
    --_openui-intelligent-flashcard-word-spacing: 0;
    transform: rotateY(180deg);
  `,
  word: css`
    font-size: var(--_openui-intelligent-flashcard-word-size, 21px);
    line-height: 1.3;
    font-weight: var(--_openui-intelligent-flashcard-word-weight, 640);
    letter-spacing: var(--_openui-intelligent-flashcard-word-spacing, -0.4px);
  `,
  hint: css`
    position: absolute;
    bottom: 10px;
    color: ${tokens.faint};
    font-size: 11px;
  `,
};
