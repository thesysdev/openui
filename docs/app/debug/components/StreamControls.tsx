"use client";

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openuidev/react-ui";
import { CHUNK_STRATEGIES, type ChunkStrategy } from "@paste/lib/streaming/chunker";
import type { PlaybackControls } from "@paste/lib/streaming/usePlayback";
import styles from "@paste/paste.module.css";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";

const SPEEDS = ["0.25", "0.5", "1", "2", "4", "8"];
const ICON = { size: 14 };

/**
 * Split so the toolbar can compose them differently per breakpoint: buttons
 * stay inline on mobile while the settings fields move into the drawer.
 * strategy/seed state lives in Toolbar for the same reason.
 */
export interface StreamSettings {
  strategy: ChunkStrategy;
  onStrategyChange: (s: ChunkStrategy) => void;
  seed: number;
  onSeedChange: (n: number) => void;
}

export function PlaybackButtons({
  playback,
  settings,
  disabled,
}: {
  playback: PlaybackControls;
  settings: StreamSettings;
  disabled?: boolean;
}) {
  const { state, start, pause, resume, step, reset } = playback;
  return (
    <>
      <div className={styles.btnGroup} role="group" aria-label="Playback controls">
        {state.status === "playing" ? (
          <Button
            variant="primary"
            size="small"
            onClick={pause}
            disabled={disabled}
            aria-label="Pause"
            title="Pause"
          >
            <Pause {...ICON} />
          </Button>
        ) : state.status === "paused" ? (
          <Button
            variant="primary"
            size="small"
            onClick={resume}
            disabled={disabled}
            aria-label="Resume"
            title="Resume"
          >
            <Play {...ICON} />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="small"
            onClick={() => start({ strategy: settings.strategy, seed: settings.seed })}
            disabled={disabled}
            aria-label="Stream"
            title="Stream (replay as simulated LLM output)"
          >
            <Play {...ICON} />
          </Button>
        )}
        <Button
          variant="secondary"
          size="small"
          onClick={step}
          disabled={disabled || state.status !== "paused"}
          aria-label="Step one chunk"
          title="Step one chunk"
        >
          <StepForward {...ICON} />
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={reset}
          disabled={disabled || state.status === "idle"}
          aria-label="Reset playback"
          title="Reset playback"
        >
          <RotateCcw {...ICON} />
        </Button>
      </div>
      {state.totalChunks > 0 && (
        <span className={styles.streamProgress}>
          {state.chunkIndex}/{state.totalChunks}
          {state.emulated && " · emulated"}
        </span>
      )}
    </>
  );
}

export function StreamSettingsFields({
  playback,
  bigInput,
  settings,
  disabled,
}: {
  playback: PlaybackControls;
  bigInput: boolean;
  settings: StreamSettings;
  disabled?: boolean;
}) {
  const { state, setSpeed, speed } = playback;
  const active = disabled || state.status === "playing" || state.status === "paused";
  const { strategy, onStrategyChange, seed, onSeedChange } = settings;

  return (
    <>
      <div className={styles.toolbarField}>
        <Label className={styles.toolbarLabel}>Chunks</Label>
        <Select
          value={strategy}
          onValueChange={(v) => onStrategyChange(v as ChunkStrategy)}
          disabled={active}
          size="sm"
        >
          <SelectTrigger size="sm" aria-label="Chunk strategy">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHUNK_STRATEGIES.map((s) => (
              <SelectItem key={s.id} value={s.id} disabled={s.id === "char" && bigInput}>
                {s.label}
                {s.id === "char" && bigInput ? " (input too large)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={styles.toolbarField}>
        <Label className={styles.toolbarLabel}>Speed</Label>
        <Select
          value={String(speed)}
          onValueChange={(v) => setSpeed(Number(v))}
          disabled={disabled}
          size="sm"
        >
          <SelectTrigger size="sm" aria-label="Playback speed">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPEEDS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}×
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={styles.toolbarField}>
        <Label className={styles.toolbarLabel}>Seed</Label>
        <Input
          type="number"
          size="small"
          className={styles.seedInput}
          value={seed}
          onChange={(e) => onSeedChange(Number(e.target.value) || 0)}
          disabled={active || strategy !== "llm"}
        />
      </div>
    </>
  );
}
