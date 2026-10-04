import { SegmentedBar } from "./SegmentedBar";
import type { SegmentedBarData, SegmentedBarProps } from "./types";

export type SingleStackedBarData = SegmentedBarData;
export type SingleStackedBarProps<T extends SingleStackedBarData> = SegmentedBarProps<T>;

/** `SegmentedBar` under its earlier name. */
export const SingleStackedBar = SegmentedBar;
