export interface SeriesProps {
  name: string;
  values: (number | null)[];
  previous?: (number | null)[];
  mark?: "line" | "area" | "bar";
  lows?: (number | null)[];
  highs?: (number | null)[];
}
export interface ReferenceProps {
  label: string;
  value: number;
  axis?: "x" | "y";
}
export interface MarkerProps {
  label: string;
  at: string;
}
