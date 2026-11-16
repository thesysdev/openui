"use client";
import { captureGalleryEvent } from "@/lib/demo-gallery-analytics";
import { useEffect, useRef } from "react";

export function GalleryExposure() {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    captureGalleryEvent("demo:gallery_viewed", "gallery", "gallery");
  }, []);
  return null;
}
