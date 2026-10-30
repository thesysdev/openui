import clsx from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { fg, type Color } from "../../shared/style";
import { names, styles } from "./caption.styles";

export interface CaptionProps extends Omit<HTMLAttributes<HTMLParagraphElement>, "color"> {
  color?: Color;
}

/** Small secondary text. */
const Caption = forwardRef<HTMLParagraphElement, CaptionProps>(({ color, className, style, children, ...rest }, ref) => (
  <p ref={ref} className={clsx(styles.root, names.root, className)} style={{ color: fg(color), ...style }} {...rest}>
    {children}
  </p>
));

Caption.displayName = "Caption";

export { Caption };
