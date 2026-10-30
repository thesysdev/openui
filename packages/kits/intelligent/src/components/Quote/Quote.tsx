import { forwardRef, type BlockquoteHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../shared/style";

export interface QuoteProps extends Omit<BlockquoteHTMLAttributes<HTMLQuoteElement>, "cite"> {
  /** The source, shown under the quotation. */
  cite?: ReactNode;
}

/** A quotation or a callout with a side rule. */
const Quote = forwardRef<HTMLQuoteElement, QuoteProps>(({ cite, className, children, ...rest }, ref) => (
  <blockquote ref={ref} className={cx("iui-quote", className)} {...rest}>
    <p>{children}</p>
    {cite != null ? <cite>{cite}</cite> : null}
  </blockquote>
));

Quote.displayName = "Quote";

export { Quote };
