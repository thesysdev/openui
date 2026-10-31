"use client";

import clsx from "clsx";
import { memo } from "react";
import { SourceFaviconImage } from "../SourceFaviconImage";
import { openSourceInNewTab, SourceWithFavicon } from "../Sources/SourceContext";
import { citationItemStyles, names } from "./citationItem.styles";

export interface CitationItemProps extends SourceWithFavicon {
  onClick?: () => void;
}

export const CitationItem = memo((props: CitationItemProps) => {
  const styles = citationItemStyles;
  const { title, sourceName, onClick, faviconUrl, url } = props;
  const handleClick = () => {
    openSourceInNewTab(url);
    onClick?.();
  };
  const hasUrl = url && url.trim() !== "";
  return (
    <button
      className={clsx(styles.root, names.root, hasUrl && styles.linked)}
      onClick={handleClick}
      type="button"
    >
      <div className={clsx(styles.logo, names.logo)}>
        <SourceFaviconImage url={faviconUrl} alt={sourceName} width={24} height={24} />
      </div>
      <div className={clsx(styles.content, names.content)}>
        <div className={clsx(styles.title, names.title)}>{title}</div>
        <div className={clsx(styles.source, names.source)}>{sourceName}</div>
      </div>
    </button>
  );
});

CitationItem.displayName = "CitationItem";
