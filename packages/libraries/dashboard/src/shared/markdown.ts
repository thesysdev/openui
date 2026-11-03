import { css } from "@openuidev/react-components";

/** Stable class for markdown the kit renders (TextContent and MarkDownRenderer). */
export const markdownName = "openui-dashboard-markdown";

/**
 * Markdown in a card breaks text with no spaces (a comma-separated list, a URL,
 * an id) at the card's edge instead of running past it. `anywhere` also lets a
 * grid or flex track shrink below that text's width.
 */
export const markdownStyle = css`
  overflow-wrap: anywhere;
`;
