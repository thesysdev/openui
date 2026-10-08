import {
  lookupArtifactRendererByType,
  useArtifactCategories,
  useArtifactRendererRegistry,
  useArtifactStorage,
  useThreadList,
  type ArtifactSummary,
} from "@openuidev/react-headless";
import { Boxes, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { artifactListPath, artifactViewPath } from "./_shared/artifactPaths";
import { useAgentInterfaceLabels } from "./_shared/labelsContext";
import { useNav } from "./_shared/navContext";
import { MascotLoader } from "./components/MascotLoader";

const SEARCH_DEBOUNCE_MS = 300;

/** Last-resort label: `"chart_v2"` → `"Chart V2"` (never the raw machine id). */
const prettifyType = (type: string): string =>
  type
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || type;

export const formatArtifactUpdatedAt = (updatedAt: ArtifactSummary["updatedAt"]) => {
  if (updatedAt === undefined) return undefined;
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
};

/**
 * Resolves the visual for an artifact type: the icon declared on its renderer
 * (`defineArtifactRenderer({ icon })`) — any ReactNode the consumer chose — or a
 * generic default. The framework is agnostic about what that node is.
 */
export const useArtifactIcon = (type: string): ReactNode => {
  const registry = useArtifactRendererRegistry();
  const rendererIcon = registry ? lookupArtifactRendererByType(registry, type)?.icon : undefined;
  return rendererIcon ?? <Boxes size="1em" />;
};

/**
 * Resolves the display label for an artifact type: the label declared on its
 * renderer (`defineArtifactRenderer({ label })`), else a prettified `type`.
 * Mirrors {@link useArtifactIcon} — never shows the raw machine id.
 */
export const useArtifactTypeLabel = (type: string): string => {
  const registry = useArtifactRendererRegistry();
  const label = registry ? lookupArtifactRendererByType(registry, type)?.label : undefined;
  return label ?? prettifyType(type);
};

const ArtifactBrowserCard = ({
  artifact,
  updatedAt,
  onClick,
}: {
  artifact: ArtifactSummary;
  updatedAt?: string;
  onClick: () => void;
}) => {
  const icon = useArtifactIcon(artifact.type);
  const typeLabel = useArtifactTypeLabel(artifact.type);
  const metadata = [typeLabel, updatedAt].filter(Boolean).join(" · ");

  return (
    <button type="button" className="openui-agent-artifact-browser__item" onClick={onClick}>
      <span className="openui-agent-artifact-browser__item-icon">{icon}</span>
      <div className="openui-agent-artifact-browser__item-meta">
        <span className="openui-agent-artifact-browser__item-title">{artifact.title}</span>
        {metadata && (
          <span className="openui-agent-artifact-browser__item-updated-at">{metadata}</span>
        )}
      </div>
    </button>
  );
};

/**
 * Full-page searchable artifact list for one category (reserved path
 * `artifacts/{category}`). Title search + category type filter are applied
 * server-side via `ArtifactStorage.list`; pagination via cursor.
 *
 * Internal — rendered by AgentInterface when the current path matches the
 * reserved `artifacts/` prefix.
 *
 * @internal
 */
export const ArtifactBrowserPage = ({ categoryName }: { categoryName?: string }) => {
  const storage = useArtifactStorage();
  const categories = useArtifactCategories();
  const { navigate } = useNav();
  const switchToNewThread = useThreadList((s) => s.switchToNewThread);
  const { defaultCategory } = useAgentInterfaceLabels();

  const category = categoryName ? categories.find((c) => c.name === categoryName) : undefined;
  // A named category that matches no configured category (stale/renamed path,
  // hand-edited or bookmarked URL). Distinct from `all` (categoryName undefined),
  // which intentionally lists everything. `categories` is static config, so this
  // is decided synchronously with no loading race.
  const notFound = categoryName !== undefined && category === undefined;
  const typeFilter = category?.filter.type;
  const categoryIllustration = useArtifactIcon(typeFilter?.[0] ?? "");
  const categoryItemLabel = categoryName
    ? categoryName.replace(/s$/i, "").toLowerCase()
    : "artifact";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [artifacts, setArtifacts] = useState<ArtifactSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  // Starts true so a fresh mount (see the `key` on this component at its render
  // site — the category name) shows the loader immediately rather than flashing
  // the empty state before the fetch effect runs.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const typeKey = typeFilter?.join(" ");
  const emptyTitle = debouncedSearch
    ? `No results found for "${debouncedSearch}"`
    : `Ready to create your first ${categoryItemLabel}?`;
  const emptySubtitle = debouncedSearch
    ? undefined
    : "Start with a prompt and create your first draft.";

  // Initial page + reload on search/category change.
  useEffect(() => {
    if (!storage || notFound) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    storage
      .list({
        name: debouncedSearch || undefined,
        type: typeKey === undefined ? undefined : typeKey.split(" "),
      })
      .then(({ artifacts: page, nextCursor: cursor }) => {
        if (requestId !== requestIdRef.current) return;
        setArtifacts(page);
        setNextCursor(cursor);
        setIsLoading(false);
      })
      .catch((e) => {
        if (requestId !== requestIdRef.current) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setIsLoading(false);
      });
  }, [storage, debouncedSearch, typeKey, notFound]);

  const loadMore = () => {
    if (!storage || nextCursor === undefined || isLoading) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    storage
      .list({
        name: debouncedSearch || undefined,
        type: typeKey === undefined ? undefined : typeKey.split(" "),
        cursor: nextCursor,
      })
      .then(({ artifacts: page, nextCursor: cursor }) => {
        if (requestId !== requestIdRef.current) return;
        setArtifacts((prev) => [...prev, ...page]);
        setNextCursor(cursor);
        setIsLoading(false);
      })
      .catch((e) => {
        if (requestId !== requestIdRef.current) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setIsLoading(false);
      });
  };

  const handleNewChat = () => {
    switchToNewThread();
    navigate(undefined);
  };

  if (!storage) return null;

  if (notFound) {
    return (
      <div className="openui-agent-artifact-browser">
        <div className="openui-agent-artifact-browser__content">
          <div className="openui-agent-artifact-browser__header">
            <h2 className="openui-agent-artifact-browser__title">{defaultCategory}</h2>
          </div>
          <div className="openui-agent-artifact-browser__list">
            <div className="openui-agent-artifact-browser__empty">
              <span className="openui-agent-artifact-browser__empty-illustration">
                <Boxes size="1em" />
              </span>
              <span className="openui-agent-artifact-browser__empty-text">
                No category named “{categoryName}”
              </span>
              <Button variant="secondary" size="small" onClick={() => navigate(artifactListPath())}>
                View all artifacts
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="openui-agent-artifact-browser">
      <div className="openui-agent-artifact-browser__content">
        <div className="openui-agent-artifact-browser__header">
          <h2 className="openui-agent-artifact-browser__title">
            {categoryName ?? defaultCategory}
          </h2>
          <div className="openui-agent-artifact-browser__search">
            <Search size={14} className="openui-agent-artifact-browser__search-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title"
              className="openui-agent-artifact-browser__search-input"
              aria-label="Search artifacts by title"
            />
            {search && (
              <IconButton
                size="2-extra-small"
                variant="tertiary"
                icon={<X size="1em" />}
                aria-label="Clear search"
                onClick={() => setSearch("")}
              />
            )}
          </div>
        </div>

        <div className="openui-agent-artifact-browser__list">
          {error && (
            <div className="openui-agent-artifact-browser__error">
              Failed to load artifacts: {error.message}
            </div>
          )}
          {!error && artifacts.length === 0 && !isLoading && (
            <div className="openui-agent-artifact-browser__empty">
              <span className="openui-agent-artifact-browser__empty-illustration">
                {categoryIllustration}
              </span>
              <div className="openui-agent-artifact-browser__empty-copy">
                <span className="openui-agent-artifact-browser__empty-text">{emptyTitle}</span>
                {emptySubtitle && (
                  <span className="openui-agent-artifact-browser__empty-subtitle">
                    {emptySubtitle}
                  </span>
                )}
              </div>
              {!debouncedSearch && (
                <Button variant="primary" size="small" onClick={handleNewChat}>
                  New Chat
                </Button>
              )}
            </div>
          )}
          {artifacts.map((artifact) => {
            const updatedAt = formatArtifactUpdatedAt(artifact.updatedAt);
            return (
              <ArtifactBrowserCard
                key={artifact.id}
                artifact={artifact}
                updatedAt={updatedAt}
                onClick={() => navigate(artifactViewPath(categoryName, artifact.id))}
              />
            );
          })}
          {isLoading && (
            <div className="openui-agent-artifact-browser__loading">
              <MascotLoader size={40} />
            </div>
          )}
          {!isLoading && nextCursor !== undefined && (
            <div className="openui-agent-artifact-browser__load-more">
              <Button variant="secondary" size="small" onClick={loadMore}>
                Load more
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
