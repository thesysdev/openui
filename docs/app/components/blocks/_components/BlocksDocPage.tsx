import { BlockVariantPreview, PreviewPage, PreviewSection } from "@components/components/preview";
import { ReactNode } from "react";

export default function BlocksDocPage({
  title,
  description,
  variantTitle = "Basic",
  variantDescription = "A basic preview variant.",
  preview,
  beforePreview,
  afterPreview,
}: {
  title: string;
  description: string;
  variantTitle?: string;
  variantDescription?: string;
  preview?: ReactNode;
  beforePreview?: ReactNode;
  afterPreview?: ReactNode;
}) {
  return (
    <PreviewPage>
      <PreviewSection title={title} headingLevel="h1" description={description}>
        {beforePreview}
        <BlockVariantPreview
          title={variantTitle}
          description={variantDescription}
          preview={preview}
        />
        {afterPreview}
      </PreviewSection>
    </PreviewPage>
  );
}
