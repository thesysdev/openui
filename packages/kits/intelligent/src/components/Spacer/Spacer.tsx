import clsx from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { names, styles } from "./spacer.styles";

export type SpacerProps = HTMLAttributes<HTMLDivElement>;

/** Fills the free space in a Row. */
const Spacer = forwardRef<HTMLDivElement, SpacerProps>(({ className, ...rest }, ref) => (
  <div ref={ref} className={clsx(styles.root, names.root, className)} aria-hidden {...rest} />
));

Spacer.displayName = "Spacer";

export { Spacer };
