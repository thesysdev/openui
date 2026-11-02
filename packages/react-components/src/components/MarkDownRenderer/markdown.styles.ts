import { css } from "../../styles/css";

const primary = "var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1))";
const body = `
  font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
  letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;
const heavy = `
  font: var(--openui-text-body-default-heavy, 560 16px/1.5 "Inter", sans-serif);
  letter-spacing: var(--openui-text-body-default-heavy-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-medium, "wght" 560);
`;
// Links and inline code are parts, styled on their own class so unlayered element resets (such
// as Tailwind 3's preflight `a` and `code` rules) cannot override them. Inside a blockquote the
// renderer marks them `data-quoted`, and they inherit colour, line-height and font-style like the
// quote's other text.
const inheritWhenQuoted = `
  &[data-quoted] {
    color: inherit;
    line-height: inherit;
    font-style: inherit;
  }
`;
// Prose inside a quote takes the quote's look, as react-ui's `.root blockquote *` did, at the same
// weight. It lists the prose tags instead of `*` so the parts (links, inline code, tables, code
// blocks) are left to their own rules, which inherit inside quotes themselves and stay
// overridable by one consumer class. One rule per tag: Goober splits selectors on commas and
// mangles nested parentheses, so neither `:where(p, li)` nor `:not(:where(a))` is possible.
// Everything markdown, GFM and raw inline HTML commonly produce inside a quote, except the parts.
const proseTags = [
  ..."p em strong b i u s del ins mark small sub sup kbd abbr q cite span br img input".split(" "),
  ..."h1 h2 h3 h4 h5 h6 ul ol li dl dt dd blockquote hr pre figure figcaption section".split(" "),
  ..."caption thead tbody tfoot tr th td".split(" "),
];
const quotedProse = proseTags
  .map(
    (tag) => `
      & blockquote :where(${tag}) {
        font-style: inherit;
        color: inherit;
        line-height: inherit;
      }`,
  )
  .join("");
const heading = `
  font: var(--openui-text-heading-xs, 600 16px/1.25 "Inter", sans-serif);
  letter-spacing: var(--openui-text-heading-xs-letter-spacing, -0.01em);
`;
/** Stable classes for markdown's root and renderer-owned replacements. */
export const names = {
  root: "openui-markdown-renderer",
  code: "openui-markdown-renderer-code",
  link: "openui-markdown-renderer-link",
  codeBlock: "openui-markdown-renderer-code-block",
  table: "openui-markdown-renderer-table",
  tableContainer: "openui-markdown-renderer-table-container",
  variant: {
    clear: "openui-markdown-renderer--variant-clear",
    card: "openui-markdown-renderer--variant-card",
    sunk: "openui-markdown-renderer--variant-sunk",
  },
  typography: {
    inherit: "openui-markdown-renderer--typography-inherit",
  },
  listLeadIn: {
    spaced: "openui-markdown-renderer--list-lead-in-spaced",
  },
  codeTypography: {
    inherit: "openui-markdown-renderer-code--typography-inherit",
  },
} as const;

export const markdownStyles = {
  code: css`
    border-radius: 4px;
    padding: 2px 4px;
    background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    color: ${primary};
    ${body}
    ${inheritWhenQuoted}
    /* Browsers ignore the legacy display:hidden declaration; preserve its rule. */
    &::after,
    &::before {
      content: "";
      display: hidden;
    }
  `,
  link: css`
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s ease-in-out;
    color: var(--openui-text-info-primary, oklch(0.424 0.181 265.638 / 1));
    ${body}
    ${inheritWhenQuoted}
    &:hover {
      text-decoration: underline;
    }
  `,
  // Syntax-highlighter markup inside the code-block part is foreign content.
  codeBlock: css`
    :where(&) {
      & > div {
        /* Preserve the shared highlighter radius when the theme has no inline radius. */
        border-radius: 0.5rem;
        padding: 25px !important;
        margin-top: 8px !important;
        margin-bottom: 8px !important;
        &:last-child {
          margin-bottom: 0 !important;
        }
      }
    }
  `,
  tableContainer: css`
    margin-bottom: 20px;
  `,
  variant: {
    clear: "",
    card: css`
      background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
      border-radius: 0.5rem;
      padding: 1rem;
    `,
    sunk: css`
      background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
      border-radius: 0.5rem;
      padding: 1rem;
    `,
  },
  // Prose (the tags markdown generates without classes) weighs the root's generated class plus the
  // tag, as react-ui's `.root p` did, so unlayered element resets such as Tailwind 3's preflight cannot
  // outweigh it while `.openui-markdown-renderer p` from the app still wins on order. Structural
  // rules keep react-ui's shapes on top of that base. Registered after the parts so first/last-child
  // spacing keeps its precedence over them.
  root: css`
    color: ${primary};
    ${body}
    max-width: none;
    & {
      & h1,
      & h2,
      & h3,
      & h4,
      & h5,
      & h6 {
        ${heading}
        color: ${primary};
        margin-bottom: 18px;
        &:has(+ p) {
          margin-bottom: 8px;
        }
        & + strong {
          ${heading}
        }
      }
      & p {
        color: ${primary};
        ${body}
        margin-bottom: 0;
        &:has(+ p) {
          margin-bottom: 18px;
        }
        /* MarkDownRenderer's listLeadIn="spaced" spaces a paragraph from the list after it. */
        &:has(+ ol) {
          margin-bottom: var(--_openui-markdown-renderer-paragraph-before-list-margin, 0px);
        }
        &:has(+ ul) {
          margin-bottom: var(--_openui-markdown-renderer-paragraph-before-list-margin, 0px);
        }
      }
      & strong {
        color: ${primary};
        ${heavy}
      }
      & li {
        margin-bottom: 8px;
        ${body}
        & :last-child {
          margin-bottom: 0;
        }
        &::marker {
          ${body}
          color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
        }
      }
      & li ul,
      & li li,
      & li ol {
        margin-top: 8px;
      }
      & ol {
        list-style-type: decimal;
        padding-left: 20px;
        margin-bottom: 20px;
        ${body}
        color: ${primary};
        & :last-child {
          margin-bottom: 0;
        }
      }
      & ul {
        list-style-type: disc;
        padding-left: 20px;
        margin-bottom: 24px;
        ${body}
        color: ${primary};
        & :last-child {
          margin-bottom: 0;
        }
      }
      & hr {
        margin-top: 48px;
        margin-bottom: 48px;
        & + * {
          margin-top: 0;
        }
      }
      & blockquote {
        color: ${primary};
        border-left: 4px solid color-mix(in oklab, ${primary} 70%, transparent);
        padding: 0 0 0 8px;
        font-style: italic;
        margin-left: 0;
        margin-top: 25px;
        margin-bottom: 25px;
        padding-left: 16px;
        quotes: "“" "”" "‘" "’";
        line-height: 1.625;
      }
      & blockquote strong {
        ${heavy}
      }
      & blockquote > *:first-child::before {
        content: open-quote;
        font-size: 1em;
        line-height: 1;
        vertical-align: top;
        margin-right: 0.2em;
      }
      & blockquote > *:last-child::after {
        content: close-quote;
        font-size: 1em;
        line-height: 1.5;
        vertical-align: top;
        margin-left: 0.2em;
      }
      ${quotedProse}
      & > *:first-child {
        margin-top: 0;
      }
      & > *:last-child {
        margin-bottom: 0;
      }
    }
  `,
  // `typography="inherit"`: emphasis takes the surrounding text's typography at medium weight, as
  // in a CompositeCard's inline markdown. After the root, so it wins over the root's emphasis.
  typography: {
    inherit: css`
      & strong {
        font: inherit;
        letter-spacing: inherit;
        font-weight: var(--openui-font-weight-medium, 560);
        font-variation-settings: var(--openui-font-variation-medium, "wght" 560);
      }
      & em {
        font: inherit;
        letter-spacing: inherit;
        font-style: italic;
      }
      & strong em {
        font-weight: var(--openui-font-weight-medium, 560);
        font-variation-settings: var(--openui-font-variation-medium, "wght" 560);
        font-style: italic;
      }
      & em strong {
        font-style: italic;
      }
    `,
  },
  listLeadIn: {
    spaced: css`
      --_openui-markdown-renderer-paragraph-before-list-margin: 8px;
    `,
  },
  // Inline code at the small code size, on the code part itself: the font shorthand resets
  // line-height, which no variable can hand back to the theme token. After the part, and its quoted
  // state, so it wins over both.
  codeTypography: {
    inherit: css`
      font: var(--openui-text-code-sm, 400 12px/1.5 "SFMono-Regular", Menlo, monospace);
      letter-spacing: var(--openui-text-code-sm-letter-spacing, 0);
      line-height: 1;
      &[data-quoted] {
        line-height: 1;
      }
    `,
  },
};
