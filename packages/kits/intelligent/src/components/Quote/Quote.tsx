import clsx from "clsx";
import { forwardRef, type BlockquoteHTMLAttributes, type ReactNode } from "react";
import { names, styles } from "./quote.styles";

export interface QuoteProps extends Omit<BlockquoteHTMLAttributes<HTMLQuoteElement>, "cite"> {
  /** The source, shown under the quotation. */
  cite?: ReactNode;
}

/** A quotation or a callout with a side rule. */
const Quote = forwardRef<HTMLQuoteElement, QuoteProps>(({ cite, className, children, ...rest }, ref) => (
  <blockquote ref={ref} className={clsx(styles.root, names.root, className)} {...rest}>
    <p className={clsx(styles.text, names.text)}>{children}</p>
    {cite != null ? <cite className={clsx(styles.cite, names.cite)}>{cite}</cite> : null}
  </blockquote>
));

Quote.displayName = "Quote";

export { Quote };
