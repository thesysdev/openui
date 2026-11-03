/**
 * A width that depends on the row a card sits in rather than on the window: `below` when the row is
 * narrower than `at`, otherwise `above`. A viewport media query can't see that a dashboard is
 * inside a 728px chat column on a wide screen, and a container query would trap the card's
 * fixed-position modal in older browsers.
 *
 * It works because a percentage here resolves against the row. Multiplying the difference by a
 * large number makes each side either hugely positive or hugely negative, so `min` and `max` pick
 * one value. The extra 1px decides a row of exactly `at`. Use it for flex-basis or min-width.
 */
export const whenRowWidth = (at: string, below: string, above: string) =>
  `max(min(${below}, calc((${at} - 100%) * 9999)), min(${above}, calc((100% - ${at} + 1px) * 9999)))`;
