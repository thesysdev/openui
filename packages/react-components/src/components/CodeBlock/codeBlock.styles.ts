import { css } from "../../styles/css";
import { iconButtonStyles } from "../IconButton/iconButton.styles";

// IconButton registers on import. Reading its map keeps that value import, so its rules come
// first and the copy button rules below win equal-weight ties.
Object.values(iconButtonStyles);

export const names = {
  root: "openui-code-block",
  copyButton: "openui-code-block-copy-button",
  syntaxHighlighter: "openui-code-block-syntax-highlighter",
} as const;

export const codeBlockStyles = {
  root: css`
    position: relative;
    --_openui-code-block-copy-button-opacity: 0;
    &:hover {
      --_openui-code-block-copy-button-opacity: 1;
    }
  `,
  // vscDarkPlus's pre frame, with the same values as react-ui. Unlike the code/token
  // theme, this element carries a documented part class and must be overridable.
  defaultFrame: css`
    color: #d4d4d4;
    font-size: 13px;
    text-shadow: none;
    font-family: Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace;
    direction: ltr;
    text-align: left;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    line-height: 1.5;
    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;
    -webkit-hyphens: none;
    -moz-hyphens: none;
    -ms-hyphens: none;
    hyphens: none;
    padding: 1em;
    margin: 0.5em 0;
    overflow: auto;
    background: #1e1e1e;
  `,
  syntaxHighlighter: css`
    margin: 0 !important;
    border-radius: 0.5rem;
  `,
};

// Register after IconButton so positioning and the opacity-only transition win base ties.
// react-ui used the normal hover/pressed background even while copied; order those states after
// copied without chaining selectors.
export const codeBlockCopyButtonStyles = {
  // Preserve template bytes so registration order stays unchanged.
  // prettier-ignore
  root: css`
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;
    opacity: var(--_openui-code-block-copy-button-opacity);
    transition: opacity 0.2s ease-in-out;
    &[data-state="copied"] {
      color: var(--openui-text-success-primary, oklch(0.448 0.108 151.328 / 1));
      background-color: var(--openui-success-background, oklch(0.627 0.17 149.214 / 0.12));
    }
    &:hover {
      background-color: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
    }
    &:active {
      background-color: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
    }
  `,
};
