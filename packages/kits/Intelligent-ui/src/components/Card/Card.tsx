import clsx from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { flow, flowName } from "../../shared/flow.styles";
import { space } from "../../shared/style";
import { cardStyles, names } from "./card.styles";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** outline (the default) is a bordered panel; soft is a filled panel for summaries. */
  variant?: "outline" | "soft";
  /** Padding in 4px steps. */
  padding?: number;
  /** Space between children in 4px steps. Without one, blocks are spaced like an article. */
  gap?: number;
}

/** Panel with a border; soft is a filled panel for summaries. */
const Card = forwardRef<HTMLElement, CardProps>(({ variant: variantProp, padding, gap, className, style, children, ...rest }, ref) => {
  const variant = variantProp === "soft" ? "soft" : "outline";
  return (
    <section
      ref={ref}
      className={clsx(cardStyles.root, names.root, cardStyles.variant[variant], names.variant[variant], gap == null && [flow, flowName], className)}
      style={{ padding: space(padding), gap: space(gap), ...style }}
      {...rest}
    >
      {children}
    </section>
  );
});

Card.displayName = "Card";

export { Card };
