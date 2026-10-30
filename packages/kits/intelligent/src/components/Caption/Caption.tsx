import { forwardRef, type HTMLAttributes } from "react";
import { cx, fg, type Color } from "../../shared/style";

export interface CaptionProps extends Omit<HTMLAttributes<HTMLParagraphElement>, "color"> {
  color?: Color;
}

/** Small secondary text. */
const Caption = forwardRef<HTMLParagraphElement, CaptionProps>(({ color, className, style, children, ...rest }, ref) => (
  <p ref={ref} className={cx("openui-intelligent-caption", className)} style={{ color: fg(color), ...style }} {...rest}>
    {children}
  </p>
));

Caption.displayName = "Caption";

export { Caption };
