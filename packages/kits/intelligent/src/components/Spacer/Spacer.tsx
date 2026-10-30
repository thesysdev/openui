import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../shared/style";

export type SpacerProps = HTMLAttributes<HTMLDivElement>;

/** Fills the free space in a Row. */
const Spacer = forwardRef<HTMLDivElement, SpacerProps>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cx("iui-spacer", className)} aria-hidden {...rest} />
));

Spacer.displayName = "Spacer";

export { Spacer };
