import { css } from "../../../styles/css";

export const names = {
  root: "openui-card-block-layout",
  grid: "openui-card-block-layout-grid",
  row: "openui-card-block-layout-row",
  item: "openui-card-block-layout-item",
  carousel: "openui-card-block-layout-carousel",
  track: "openui-card-block-layout-carousel-track",
  carouselItem: "openui-card-block-layout-carousel-item",
  size: {
    small: "openui-card-block-layout--size-small",
    medium: "openui-card-block-layout--size-medium",
  },
  layout: {
    grid: "openui-card-block-layout--layout-grid",
    carousel: "openui-card-block-layout--layout-carousel",
  },
  responsive: {
    true: "openui-card-block-layout--responsive",
  },
  cardType: {
    "composite-card": "openui-card-block-layout--card-type-composite-card",
    "context-card": "openui-card-block-layout--card-type-context-card",
    "visual-first-card": "openui-card-block-layout--card-type-visual-first-card",
    "overview-card": "openui-card-block-layout--card-type-overview-card",
    "value-card": "openui-card-block-layout--card-type-value-card",
  },
} as const;

export const cardBlockLayoutStyles = {
  root: css`
    width: 100%;
    container-type: inline-size;
    --_openui-card-block-layout-gap: var(
      --_openui-card-block-layout-gap-input,
      var(--openui-space-m, 12px)
    );
    --_openui-card-block-layout-grid-display: flex;
    --_openui-card-block-layout-grid-columns: none;
    --_openui-card-block-layout-mobile-grid-columns: none;
    --_openui-card-block-layout-row-display: grid;
    --_openui-card-block-layout-mobile-width: var(--_openui-card-block-layout-width);
    --_openui-card-block-layout-last-column: auto;
  `,
  size: {
    small: css`
      --_openui-card-block-layout-item-display: grid;
      --_openui-card-block-layout-width: var(--_openui-card-block-layout-small-width, 17.5rem);
      --_openui-card-block-layout-responsive-width: var(
        --_openui-card-block-layout-small-mobile-width,
        15rem
      );
    `,
    medium: css`
      --_openui-card-block-layout-item-display: block;
      --_openui-card-block-layout-width: 20rem;
      --_openui-card-block-layout-responsive-width: 17.5rem;
    `,
  },
  layout: {
    grid: "",
    carousel: css`
      padding: 0;
    `,
  },
  responsive: {
    true: css`
      --_openui-card-block-layout-grid-display: grid;
      --_openui-card-block-layout-grid-columns: repeat(2, minmax(0, 1fr));
      --_openui-card-block-layout-mobile-grid-columns: 1fr;
      --_openui-card-block-layout-row-display: contents;
      --_openui-card-block-layout-mobile-width: var(--_openui-card-block-layout-responsive-width);
      --_openui-card-block-layout-last-column: 1 / -1;
    `,
  },
  cardType: {
    "composite-card": css`
      --_openui-card-block-layout-small-width: 17.5rem;
      --_openui-card-block-layout-small-mobile-width: 15rem;
    `,
    "context-card": css`
      --_openui-card-block-layout-small-width: 17.5rem;
      --_openui-card-block-layout-small-mobile-width: 15rem;
    `,
    "visual-first-card": css`
      --_openui-card-block-layout-small-width: 17.5rem;
      --_openui-card-block-layout-small-mobile-width: 15rem;
    `,
    "overview-card": css`
      /* react-ui shrinks Overview carousels on narrow containers even with responsive=false. */
      --_openui-card-block-layout-mobile-width: 12.5rem;
      --_openui-card-block-layout-small-width: 15rem;
      --_openui-card-block-layout-small-mobile-width: 12.5rem;
    `,
    "value-card": css`
      --_openui-card-block-layout-small-width: 17.5rem;
      --_openui-card-block-layout-small-mobile-width: 15rem;
    `,
  },
  grid: css`
    display: flex;
    flex-direction: column;
    gap: var(--_openui-card-block-layout-gap);
    width: 100%;
    @container (max-width:48rem) {
      display: var(--_openui-card-block-layout-grid-display);
      grid-template-columns: var(--_openui-card-block-layout-grid-columns);
    }
    @container (max-width:30rem) {
      grid-template-columns: var(--_openui-card-block-layout-mobile-grid-columns);
    }
  `,
  row: css`
    display: grid;
    gap: var(--_openui-card-block-layout-gap);
    width: 100%;
    align-items: stretch;
    &[data-columns="1"] {
      grid-template-columns: 1fr;
    }
    &[data-columns="2"] {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    &[data-columns="3"] {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    @container (max-width:48rem) {
      display: var(--_openui-card-block-layout-row-display);
    }
  `,
  item: css`
    display: var(--_openui-card-block-layout-item-display);
    width: 100%;
    min-width: 0;
    @container (max-width:48rem) {
      &[data-span="full"] {
        grid-column: var(--_openui-card-block-layout-last-column);
      }
    }
  `,
  carousel: css`
    width: 100%;
    overflow-x: auto;
    overflow-y: visible;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
    &[data-mask="both"] {
      mask-image: linear-gradient(
        to right,
        #0000,
        #000 var(--openui-space-3xl, 48px),
        #000 calc(100% - var(--openui-space-3xl, 48px)),
        #0000
      );
      -webkit-mask-image: linear-gradient(
        to right,
        #0000,
        #000 var(--openui-space-3xl, 48px),
        #000 calc(100% - var(--openui-space-3xl, 48px)),
        #0000
      );
    }
    &[data-mask="left"] {
      mask-image: linear-gradient(to right, #0000, #000 var(--openui-space-3xl, 48px), #000);
      -webkit-mask-image: linear-gradient(
        to right,
        #0000,
        #000 var(--openui-space-3xl, 48px),
        #000
      );
    }
    &[data-mask="right"] {
      mask-image: linear-gradient(to left, #0000, #000 var(--openui-space-3xl, 48px), #000);
      -webkit-mask-image: linear-gradient(to left, #0000, #000 var(--openui-space-3xl, 48px), #000);
    }
  `,
  track: css`
    display: flex;
    gap: var(--_openui-card-block-layout-gap);
    padding: var(--openui-space-2xs, 4px) 0;
    width: max-content;
  `,
  carouselItem: css`
    display: var(--_openui-card-block-layout-item-display);
    flex-shrink: 0;
    width: var(--_openui-card-block-layout-width);
    @container (max-width:30rem) {
      width: var(--_openui-card-block-layout-mobile-width);
    }
  `,
};
