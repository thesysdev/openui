"use client";

import clsx from "clsx";
import React, { useCallback, useMemo, useState } from "react";
import { Button } from "../Button";
import { GalleryModal } from "./GalleryModal";
import { imageGalleryStyles, names } from "./imageGallery.styles";

export interface ImageItem {
  src: string;
  alt?: string;
  details?: string;
}

export interface OpenUIGalleryProps {
  images: ImageItem[];
}

const MAX_GRID_IMAGES = 5;
const getLayout = (imageCount: number) => {
  switch (imageCount) {
    case 1:
      return "single";
    case 2:
      return "double";
    case 3:
      return "triple";
    case 4:
      return "quad";
    default:
      return "default";
  }
};

export const ImageGallery: React.FC<OpenUIGalleryProps> = ({ images }) => {
  const styles = imageGalleryStyles;
  const [showAll, setShowAll] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Memoize layout class to prevent recalculation
  const layoutClass = useMemo(() => getLayout(images.length), [images.length]);

  // Memoize whether to show button
  const shouldShowButton = useMemo(() => images.length > MAX_GRID_IMAGES, [images.length]);

  // Memoize visible images
  const visibleImages = useMemo(() => images.slice(0, MAX_GRID_IMAGES), [images]);

  // Memoize callbacks
  const toggleShowAll = useCallback(() => {
    setShowAll((prev) => !prev);
  }, []);

  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setShowAll(true);
  }, []);

  const setSelectedImageIndexMemoized = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  return (
    <div className={clsx(styles.root, names.root)} data-layout={layoutClass}>
      <div className={clsx(styles.grid, names.grid)}>
        {visibleImages.map((image, index) => (
          <div
            key={index}
            className={clsx(styles.image, names.image)}
            data-position={index + 1}
            onClick={() => handleImageClick(index)}
          >
            <img
              className={clsx(styles.img, names.img)}
              src={image.src}
              alt={image.alt || `Gallery image ${index + 1}`}
            />
          </div>
        ))}
        {shouldShowButton && (
          <div className={clsx(styles.showAll, names.showAll)}>
            <Button variant="primary" size="small" onClick={toggleShowAll}>
              Show All
            </Button>
          </div>
        )}
      </div>

      {showAll && (
        <GalleryModal
          images={images}
          selectedImageIndex={selectedImageIndex}
          setSelectedImageIndex={setSelectedImageIndexMemoized}
          onClose={toggleShowAll}
        />
      )}
    </div>
  );
};
