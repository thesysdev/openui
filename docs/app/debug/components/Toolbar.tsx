"use client";

import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tag,
} from "@openuidev/react-ui";
import { useMediaQuery } from "@paste/hooks/useMediaQuery";
import type { VersionListState } from "@paste/hooks/useVersionList";
import { EXAMPLES } from "@paste/lib/examples";
import { LIBRARIES, type LibraryId } from "@paste/lib/libraries";
import type { ChunkStrategy } from "@paste/lib/streaming/chunker";
import type { PlaybackControls } from "@paste/lib/streaming/usePlayback";
import type { LoadedLangCore } from "@paste/lib/versions/types";
import { ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HelpDialog } from "./HelpDialog";
import { PlaybackButtons, StreamSettingsFields } from "./StreamControls";
// The docs site's own toggle (animated sun/moon, phosphor icons) — same one
// as the homepage header, so /debug matches the rest of the site.
import { ThemeToggle } from "@/components/theme-toggle";
import styles from "@paste/paste.module.css";
import { VersionPicker } from "./VersionPicker";

export function Toolbar({
  libraryId,
  onLibraryChange,
  version,
  onVersionChange,
  versions,
  loaded,
  onLoadExample,
  playback,
  bigInput,
  versionLoading,
}: {
  libraryId: LibraryId;
  onLibraryChange: (id: LibraryId) => void;
  version: string;
  onVersionChange: (v: string) => void;
  versions: VersionListState;
  loaded: LoadedLangCore | null;
  onLoadExample: (code: string) => void;
  playback: PlaybackControls;
  bigInput: boolean;
  versionLoading: boolean;
}) {
  const playbackActive = playback.state.status === "playing" || playback.state.status === "paused";
  // strategy/seed live here (not in StreamControls) so the play button in the
  // toolbar and the settings fields in the mobile drawer share them.
  const [strategy, setStrategy] = useState<ChunkStrategy>("llm");
  const [seed, setSeed] = useState(42);
  const settings = {
    strategy,
    onStrategyChange: setStrategy,
    seed,
    onSeedChange: setSeed,
  };

  const narrow = useMediaQuery("(max-width: 860px)");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const libraryField = (
    <div className={styles.toolbarField}>
      <Label className={styles.toolbarLabel}>Library</Label>
      <Select
        value={libraryId}
        onValueChange={(v) => onLibraryChange(v as LibraryId)}
        disabled={playbackActive}
        size="sm"
      >
        <SelectTrigger size="sm" aria-label="Component library">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LIBRARIES.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const examplesField = (
    <div className={styles.toolbarField}>
      {!narrow && <Label className={styles.toolbarLabel}>Examples</Label>}
      {/* value stays "" so the same example can be re-selected */}
      <Select
        value=""
        onValueChange={(id) => {
          const ex = EXAMPLES.find((x) => x.id === id);
          if (ex) onLoadExample(ex.code);
        }}
        disabled={playbackActive}
        size="sm"
      >
        <SelectTrigger size="sm" aria-label="Load example">
          <SelectValue placeholder={narrow ? "Examples" : "Select"} />
        </SelectTrigger>
        <SelectContent>
          {EXAMPLES.map((ex) => (
            <SelectItem key={ex.id} value={ex.id}>
              {ex.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const viaTag =
    loaded && loaded.source !== "bundled" ? (
      <Tag size="sm" variant="info" text={`via ${loaded.source}`} />
    ) : null;

  return (
    <>
      <header className={styles.topbar}>
        <Link className={styles.backLink} href="/" prefetch={false}>
          <ArrowLeft aria-hidden size={16} />
          <span>Back to docs</span>
        </Link>
        <div className={styles.topbarRight}>
          <span className={styles.toolbarLogo}>OpenUI Debug</span>
          <ThemeToggle />
        </div>
      </header>
      <div className={styles.toolbar}>
        <div className={styles.toolbarControls}>
          <PlaybackButtons playback={playback} settings={settings} disabled={versionLoading} />
          {narrow ? (
            <>
              {examplesField}
              <Button
                variant="secondary"
                size="small"
                onClick={() => setDrawerOpen(true)}
                aria-label="Playground settings"
                title="Playground settings"
                aria-haspopup="dialog"
              >
                <SlidersHorizontal size={16} />
              </Button>
            </>
          ) : (
            <>
              <StreamSettingsFields
                playback={playback}
                bigInput={bigInput}
                settings={settings}
                disabled={versionLoading}
              />
              <span className={styles.toolbarDivider} aria-hidden />
              {libraryField}
              <VersionPicker
                value={version}
                onChange={onVersionChange}
                versions={versions}
                disabled={playbackActive}
              />
              {examplesField}
              {viaTag}
            </>
          )}
          <HelpDialog />
        </div>
      </div>
      {narrow && drawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)}>
          <div
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Playground settings"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <h2>Settings</h2>
              <Button
                variant="tertiary"
                size="small"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close settings"
              >
                <X size={16} />
              </Button>
            </div>
            <div className={styles.drawerBody}>
              <StreamSettingsFields
                playback={playback}
                bigInput={bigInput}
                settings={settings}
                disabled={versionLoading}
              />
              {libraryField}
              <VersionPicker
                value={version}
                onChange={onVersionChange}
                versions={versions}
                disabled={playbackActive}
              />
              {viaTag}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
