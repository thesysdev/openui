import type { CSSProperties, ReactNode } from "react";
import styles from "./BlockVariantPreview.module.css";
import PromptCopyButton from "./PromptCopyButton";

interface BlockVariantPreviewProps {
  title?: string;
  description?: string;
  preview?: ReactNode;
  headerControl?: ReactNode;
  rightControls?: ReactNode;
  prompt?: ReactNode | string;
  promptTitle?: string;
}

export default function BlockVariantPreview({
  title,
  description,
  preview,
  headerControl,
  rightControls,
  prompt,
  promptTitle = "Prompt",
}: BlockVariantPreviewProps) {
  const previewContent = preview ?? <span className={styles.placeholder}>Preview</span>;
  const promptContent =
    prompt ?? "A small prompt to be used to add this component in your generations";
  const promptCopyText = typeof promptContent === "string" ? promptContent : "";
  const variantStyle = rightControls
    ? ({ "--section-content-max-width": "1020px" } as CSSProperties)
    : undefined;

  return (
    <div className={styles.variant} style={variantStyle}>
      <div className={styles.header}>
        {title ? <h2 className={styles.title}>{title}</h2> : null}
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>

      {rightControls ? (
        <div className={styles.previewWithRightControls}>
          <div className={styles.previewWithRightControlsSurface}>{previewContent}</div>
          <aside className={styles.previewRightControls}>{rightControls}</aside>
        </div>
      ) : headerControl ? (
        <div className={styles.previewContainer}>
          <div className={styles.previewToolbar}>{headerControl}</div>
          <div className={styles.previewSurface}>{previewContent}</div>
        </div>
      ) : (
        <div className={styles.preview}>{previewContent}</div>
      )}

      <div className={styles.prompt}>
        <div className={styles.promptHeader}>
          <p className={styles.promptLabel}>{promptTitle}</p>
          <PromptCopyButton text={promptCopyText} />
        </div>
        <div className={styles.promptField}>
          {typeof promptContent === "string" ? (
            <p className={styles.promptText}>{promptContent}</p>
          ) : (
            promptContent
          )}
        </div>
      </div>
    </div>
  );
}
