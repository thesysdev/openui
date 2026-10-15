import clsx from "clsx";
import { X } from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "../IconButton";
import { useTheme } from "../ThemeProvider";
import { ImageItem } from "./ImageGallery";

export interface GalleryModalProps {
  images: ImageItem[];
  selectedImageIndex: number;
  setSelectedImageIndex: (index: number) => void;
  onClose: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  images,
  selectedImageIndex,
  setSelectedImageIndex,
  onClose,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const { portalThemeClassName } = useTheme();

  // Handle lightbox lifecycle events (scroll lock, close on escape, arrow key navigation)
  useEffect(() => {
    // Disable body scroll
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && selectedImageIndex > 0) {
        setSelectedImageIndex(selectedImageIndex - 1);
      } else if (e.key === "ArrowRight" && selectedImageIndex < images.length - 1) {
        setSelectedImageIndex(selectedImageIndex + 1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, selectedImageIndex, setSelectedImageIndex, images.length]);

  // Keep the active thumbnail in view
  useEffect(() => {
    const active = carouselRef.current?.children[selectedImageIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [selectedImageIndex]);

  // Close when the empty backdrop around the image is clicked
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  // Memoize thumbnail click handler
  const handleThumbnailClick = useCallback(
    (index: number) => () => setSelectedImageIndex(index),
    [setSelectedImageIndex],
  );

  return createPortal(
    <div
      className={clsx("openui-gallery__modal", portalThemeClassName)}
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery"
      onClick={handleBackdropClick}
    >
      <IconButton
        className="openui-gallery__modal-close"
        size="small"
        variant="tertiary"
        icon={<X />}
        onClick={onClose}
        aria-label="Close gallery"
      />
      <div className="openui-gallery__modal-main" onClick={handleBackdropClick}>
        <img
          src={images[selectedImageIndex]?.src}
          alt={images[selectedImageIndex]?.alt || `Gallery image ${selectedImageIndex + 1}`}
        />
      </div>
      <div className="openui-gallery__modal-carousel" ref={carouselRef}>
        {images.map((image, index) => (
          <div
            key={index}
            className={clsx(
              "openui-gallery__modal-thumbnail",
              index === selectedImageIndex && "openui-gallery__modal-thumbnail--active",
            )}
            role="button"
            tabIndex={0}
            aria-label={image.alt || `Gallery image ${index + 1}`}
            aria-pressed={index === selectedImageIndex}
            onClick={handleThumbnailClick(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleThumbnailClick(index)();
              }
            }}
          >
            <img src={image.src} alt="" aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
};
