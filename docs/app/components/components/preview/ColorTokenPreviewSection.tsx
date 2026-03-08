import PreviewSwatchesSection from "@components/components/preview/PreviewSwatchesSection";
import type { ComponentProps } from "react";

type ColorTokenPreviewSectionProps = ComponentProps<typeof PreviewSwatchesSection>;

export default function ColorTokenPreviewSection(props: ColorTokenPreviewSectionProps) {
  return <PreviewSwatchesSection {...props} />;
}
