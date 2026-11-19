import { css } from "../../styles/css";

export const names = {
  root: "openui-image-gallery",
  grid: "openui-image-gallery-grid",
  image: "openui-image-gallery-image",
  img: "openui-image-gallery-img",
  showAll: "openui-image-gallery-show-all",
} as const;
export const imageGalleryStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: hidden;
    position: relative;
    border-radius: var(--openui-radius-m, 8px);

    &[data-layout="single"] {
      --_openui-image-gallery-columns: 1fr;
    }
    &[data-layout="double"] {
      --_openui-image-gallery-columns: repeat(2, 1fr);
    }
    &[data-layout="triple"] {
      --_openui-image-gallery-columns: 1fr 1fr;
      --_openui-image-gallery-rows: 1fr 1fr;
      --_openui-image-gallery-area-1: 1 / auto / -1;
      @media (max-width: 768px) {
        --_openui-image-gallery-columns: repeat(2, 1fr);
        --_openui-image-gallery-rows: repeat(2, 1fr);
        --_openui-image-gallery-areas: "img1 img1" "img2 img3";
        --_openui-image-gallery-area-1: img1;
        --_openui-image-gallery-area-2: img2;
        --_openui-image-gallery-area-3: img3;
      }
    }
    &[data-layout="quad"] {
      --_openui-image-gallery-columns: repeat(4, 1fr);
      --_openui-image-gallery-rows: repeat(2, 1fr);
      --_openui-image-gallery-areas: "img1 img1 img2 img2" "img1 img1 img3 img4";
      --_openui-image-gallery-area-1: img1;
      --_openui-image-gallery-area-2: img2;
      --_openui-image-gallery-area-3: img3;
      --_openui-image-gallery-area-4: img4;
    }
    &[data-layout="default"] {
      --_openui-image-gallery-columns: 2fr 1fr 1fr;
      --_openui-image-gallery-rows: 1fr 1fr;
      --_openui-image-gallery-area-1: 1 / auto / -1;
      @media (max-width: 768px) {
        --_openui-image-gallery-columns: repeat(6, 1fr);
        --_openui-image-gallery-rows: repeat(2, 1fr);
        --_openui-image-gallery-areas: "img1 img1 img1 img2 img2 img2"
          "img3 img3 img4 img4 img5 img5";
        --_openui-image-gallery-area-1: img1;
        --_openui-image-gallery-area-2: img2;
        --_openui-image-gallery-area-3: img3;
        --_openui-image-gallery-area-4: img4;
        --_openui-image-gallery-area-5: img5;
      }
    }
  `,
  grid: css`
    display: grid;
    width: 100%;
    max-height: 376px;
    grid-gap: var(--openui-space-s, 8px);
    grid-template-columns: var(--_openui-image-gallery-columns);
    grid-template-rows: var(--_openui-image-gallery-rows, none);
    grid-template-areas: var(--_openui-image-gallery-areas, none);
  `,
  image: css`
    position: relative;
    overflow: hidden;
    &[data-position="1"] {
      grid-area: var(--_openui-image-gallery-area-1, auto);
    }
    &[data-position="2"] {
      grid-area: var(--_openui-image-gallery-area-2, auto);
    }
    &[data-position="3"] {
      grid-area: var(--_openui-image-gallery-area-3, auto);
    }
    &[data-position="4"] {
      grid-area: var(--_openui-image-gallery-area-4, auto);
    }
    &[data-position="5"] {
      grid-area: var(--_openui-image-gallery-area-5, auto);
    }
  `,
  img: css`
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
    &:hover {
      transform: scale(1.05);
    }
  `,
  showAll: css`
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    bottom: 5px;
    right: 5px;
  `,
};
