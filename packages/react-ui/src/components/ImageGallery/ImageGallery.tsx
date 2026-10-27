import clsx from "clsx";
import React, { useCallback, useMemo, useState } from "react";
import { GalleryModal } from "./GalleryModal";

export interface ImageItem {
  src: string;
  alt?: string;
  details?: string;
}

export interface OpenUIGalleryProps {
  images: ImageItem[];
}

const MAX_GRID_IMAGES = 5;
const getLayoutClassName = (imageCount: number): string => {
  switch (imageCount) {
    case 1:
      return "openui-gallery--single";
    case 2:
      return "openui-gallery--double";
    case 3:
      return "openui-gallery--triple";
    case 4:
      return "openui-gallery--quad";
    default:
      return "openui-gallery--default";
  }
};

export const ImageGallery: React.FC<OpenUIGalleryProps> = ({ images: allImages }) => {
  // Skip images without a src yet (mid-stream or empty): src="" is invalid.
  const images = useMemo(() => allImages.filter((image) => !!image?.src), [allImages]);
  // Clicking any tile opens the lightbox, which browses every image, including
  // ones past the first five that the grid doesn't show.
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Memoize layout class to prevent recalculation
  const layoutClass = useMemo(() => getLayoutClassName(images.length), [images.length]);

  // Memoize visible images
  const visibleImages = useMemo(() => images.slice(0, MAX_GRID_IMAGES), [images]);

  // Memoize callbacks
  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setIsOpen(true);
  }, []);

  const setSelectedImageIndexMemoized = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  return (
    <div className={clsx("openui-gallery", layoutClass)}>
      <div className="openui-gallery__grid">
        {visibleImages.map((image, index) => (
          <div
            key={index}
            className={clsx("openui-gallery__image", index === 0 && "openui-gallery__image--main")}
            onClick={() => handleImageClick(index)}
          >
            <img src={image.src} alt={image.alt || `Gallery image ${index + 1}`} />
          </div>
        ))}
      </div>

      {isOpen && (
        <GalleryModal
          images={images}
          selectedImageIndex={selectedImageIndex}
          setSelectedImageIndex={setSelectedImageIndexMemoized}
          onClose={closeModal}
        />
      )}
    </div>
  );
};
