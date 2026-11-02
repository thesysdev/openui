"use client";

import clsx from "clsx";
import { Button } from "../Button";
import { useThemeMode } from "../../shared/scheme";
import { tokens } from "../../shared/tokens";
import { names, segmentedControlStyles } from "./segmentedControl.styles";

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  /** The chosen option's value. */
  value: string;
  onChange: (value: string) => void;
  /** Fills the width of its column. */
  block?: boolean;
}

/** A pill track: a radiogroup whose options are the kit's buttons, the chosen one a raised pill. */
export function SegmentedControl({ options, value, onChange, block }: SegmentedControlProps) {
  // A canvas pill reads on light; on dark it would sink below its track, so it lifts to a stronger surface.
  const fill = useThemeMode() === "dark" ? { ["--_openui-intelligent-segment-fill" as string]: tokens.surfaceStrong } : undefined;
  return (
    <div className={clsx(segmentedControlStyles.root, names.root, block && [segmentedControlStyles.block, names.block])} style={fill} role="radiogroup">
      {options.map((o, i) => (
        <Button
          key={`${o.value}-${i}`}
          variant="ghost"
          size="sm"
          role="radio"
          aria-checked={o.value === value}
          className={clsx(segmentedControlStyles.option, names.option)}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
