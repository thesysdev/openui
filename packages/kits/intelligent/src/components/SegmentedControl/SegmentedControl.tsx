import { cx } from "../../shared/style";
import { Button } from "../Button";

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
  return (
    <div className={cx("iui-segmented", block && "iui-block")} role="radiogroup">
      {options.map((o, i) => (
        <Button
          key={`${o.value}-${i}`}
          variant="ghost"
          size="sm"
          role="radio"
          aria-checked={o.value === value}
          className={cx("iui-segment", o.value === value && "is-selected")}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
