import clsx from "clsx";
import { Key, memo } from "react";
import { DisclosureSection } from "../_shared/DisclosureSection";
import { SourceFaviconImage } from "../SourceFaviconImage";
import { SourceWithFavicon } from "./SourceContext";
import { ListedSourceItem } from "./SourcesItem";

export interface ListedSourcesProps {
  sources: SourceWithFavicon[];
  /** Start expanded. Collapsed by default. */
  defaultOpen?: boolean;
}

// Favicons stacked beside the collapsed header, one per distinct site.
const FaviconStack = ({ sources }: { sources: SourceWithFavicon[] }) => {
  const seen = new Set<string>();
  const unique = sources.filter((s) => {
    const k = s.faviconUrl || s.sourceName;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return (
    <span className="openui-listed-sources-favicons" aria-hidden>
      {unique.slice(0, 4).map((s, i) => (
        <span key={i} className="openui-listed-sources-favicons__item">
          <SourceFaviconImage url={s.faviconUrl} alt="" width={14} height={14} />
        </span>
      ))}
    </span>
  );
};

export const ListedSources = memo((props: ListedSourcesProps) => {
  const sources = props.sources ?? [];
  if (!sources.length) return null;

  return (
    <div className="openui-listed-sources">
      <DisclosureSection
        label="Sources"
        count={sources.length}
        preview={<FaviconStack sources={sources} />}
        defaultOpen={props.defaultOpen}
      >
        <div className="openui-listed-sources__grid">
          {sources.map((item: SourceWithFavicon, index: number) => {
            const { key: _key, ...rest } = item as SourceWithFavicon & { key?: Key };
            return (
              <div
                key={item.url ?? index}
                className={clsx("openui-listed-sources-item-container", {
                  "openui-listed-sources-item-container--has-url": item.url,
                })}
              >
                <ListedSourceItem {...rest} sourceId={index} />
              </div>
            );
          })}
        </div>
      </DisclosureSection>
    </div>
  );
});

ListedSources.displayName = "ListedSources";
