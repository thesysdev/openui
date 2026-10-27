import clsx from "clsx";
import { Children, CSSProperties, forwardRef, ReactElement } from "react";
import { DisclosureSection } from "../_shared/DisclosureSection";
import { FollowUpItemProps } from "../FollowUpItem";

export interface FollowUpBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactElement<FollowUpItemProps> | ReactElement<FollowUpItemProps>[];
  /** Header label. Defaults to "Related queries". */
  label?: string;
  /** Start expanded. Collapsed by default. */
  defaultOpen?: boolean;
  className?: string;
  style?: CSSProperties;
}

const FollowUpBlock = forwardRef<HTMLDivElement, FollowUpBlockProps>((props, ref) => {
  const { children, label = "Related queries", defaultOpen, className, style, ...rest } = props;
  return (
    <div ref={ref} className={clsx("openui-follow-up-block", className)} style={style} {...rest}>
      <DisclosureSection label={label} count={Children.count(children)} defaultOpen={defaultOpen}>
        <div className="openui-follow-up-block__items">{children}</div>
      </DisclosureSection>
    </div>
  );
});

FollowUpBlock.displayName = "FollowUpBlock";

export { FollowUpBlock };
