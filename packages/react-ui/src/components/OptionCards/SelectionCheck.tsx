import clsx from "clsx";

// The 18px round check chip shared with Checklist: an empty ring until
// selected, then filled black with a white check. Inline so the mark never
// waits on the lazily loaded icon set. The check is always drawn so it can
// animate in: the ring fills and the stroke draws itself.
export const SelectionCheck = ({
  checked,
  className,
}: {
  checked: boolean;
  className?: string;
}) => (
  <span
    aria-hidden
    className={clsx(
      "openui-selection-check",
      checked && "openui-selection-check--checked",
      className,
    )}
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" pathLength={1} />
    </svg>
  </span>
);
