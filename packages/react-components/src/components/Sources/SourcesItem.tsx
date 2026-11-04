"use client";

import clsx from "clsx";
import { memo } from "react";
import { SourceFaviconImage } from "../SourceFaviconImage";
import { openSourceInNewTab, SourceWithFavicon } from "./SourceContext";
import { names, sourcesItemStyles } from "./sourcesItem.styles";

export interface SourcesItemComponentProps extends SourceWithFavicon {
  onClick?: () => void;
  sourceId: number;
}

export const ListedSourceItem = memo((props: SourcesItemComponentProps) => {
  const styles = sourcesItemStyles;
  const { title, sourceName, onClick, faviconUrl, url, sourceId } = props;
  const handleClick = () => {
    openSourceInNewTab(url);
    onClick?.();
  };
  const hasUrl = url && url.trim() !== "";
  return (
    <div
      className={clsx(styles.root, names.root, hasUrl && styles.linked)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      data-source-id={sourceId}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={clsx(styles.header, names.header)}>
        <div className={clsx(styles.logo, names.logo)}>
          <SourceFaviconImage url={faviconUrl} alt={sourceName} width={20} height={20} />
        </div>
        <span className={clsx(styles.name, names.name)}>{sourceName}</span>
      </div>
      <div className={clsx(styles.title, names.title)}>{title}</div>
    </div>
  );
});

ListedSourceItem.displayName = "ListedSourceItem";
