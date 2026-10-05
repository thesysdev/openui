import clsx from "clsx";
import { memo } from "react";
import { SourceFaviconImage } from "../SourceFaviconImage";
import { openSourceInNewTab, SourceWithFavicon } from "./SourceContext";

export interface SourcesItemComponentProps extends SourceWithFavicon {
  onClick?: () => void;
  sourceId: number;
}

export const ListedSourceItem = memo((props: SourcesItemComponentProps) => {
  const { title, sourceName, onClick, faviconUrl, url, sourceId } = props;
  const handleClick = () => {
    openSourceInNewTab(url);
    onClick?.();
  };
  const hasUrl = url && url.trim() !== "";
  return (
    <div
      className={clsx("openui-listed-source-item", {
        "openui-listed-source-item--has-url": hasUrl,
      })}
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
      <div className="openui-listed-source-item__header">
        <div className="openui-listed-source-item__logo">
          <SourceFaviconImage url={faviconUrl} alt={sourceName} width={20} height={20} />
        </div>
        <span className="openui-listed-source-item__source-name">{sourceName}</span>
      </div>
      <div className="openui-listed-source-item__title">{title}</div>
    </div>
  );
});

ListedSourceItem.displayName = "ListedSourceItem";
