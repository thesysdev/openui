import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { useStyles, type ThemeTokens } from "../theme";
import type { DevtoolsPosition } from "../types";
import { IconButton } from "./IconButton";

const OPTIONS: { id: DevtoolsPosition; label: string; icon: typeof ArrowUpLeft }[] = [
  { id: "top-left", label: "Top left", icon: ArrowUpLeft },
  { id: "top-right", label: "Top right", icon: ArrowUpRight },
  { id: "bottom-left", label: "Bottom left", icon: ArrowDownLeft },
  { id: "bottom-right", label: "Bottom right", icon: ArrowDownRight },
];

/** Four icon buttons for the Inspect settings menu that pick the launcher's corner. */
export function PositionSegmented({
  value,
  onChange,
}: {
  value: DevtoolsPosition;
  onChange: (value: DevtoolsPosition) => void;
}) {
  const styles = useStyles(segmentedStyles);
  return (
    <div style={styles.segmented} role="radiogroup" aria-label="Position">
      {OPTIONS.map((option) => {
        const active = value === option.id;
        const Icon = option.icon;
        return (
          <IconButton
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            style={active ? styles.selected : undefined}
            onClick={() => onChange(option.id)}
            aria-label={option.label}
            title={option.label}
          >
            <Icon size={14} />
          </IconButton>
        );
      })}
    </div>
  );
}

function segmentedStyles(t: ThemeTokens) {
  return {
    segmented: {
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      flexShrink: 0,
    },
    selected: {
      background: t.inverted,
      color: t.invertedFg,
      borderColor: t.inverted,
    },
  } satisfies Record<string, CSSProperties>;
}
