import clsx from "clsx";
import {
  Children,
  cloneElement,
  CSSProperties,
  forwardRef,
  isValidElement,
  ReactElement,
} from "react";
import { ListItemProps, ListItemVariant } from "../ListItem";

export interface ListBlockProps {
  /** "number" puts an accent number before every title; "plain" shows none. Defaults to "number". */
  variant?: ListItemVariant;
  children: ReactElement<ListItemProps> | ReactElement<ListItemProps>[];
  className?: string;
  style?: CSSProperties;
}

const ListBlock = forwardRef<HTMLDivElement, ListBlockProps>((props, ref) => {
  const { children, variant = "number", className, style } = props;

  const childArray = Children.toArray(children);
  const listHasSubtitle = childArray.some(
    (child) => isValidElement(child) && !!(child as ReactElement<ListItemProps>).props.subtitle,
  );

  const enhancedChildren = Children.map(children, (child, index) => {
    if (isValidElement(child)) {
      return cloneElement(child as ReactElement<ListItemProps>, {
        variant,
        listHasSubtitle,
        index,
      });
    }
    return child;
  });

  return (
    <div ref={ref} className={clsx("openui-list-block", className)} style={style}>
      {enhancedChildren}
    </div>
  );
});

ListBlock.displayName = "ListBlock";

export { ListBlock };
