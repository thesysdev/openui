import {
  ListItem as BaseListItem,
  IconWrapper,
  InlineMarkdownRenderer,
  ListBlock,
} from "@openuidev/react-components";
import clsx from "clsx";
import { names, styles } from "./list.styles";

export interface ListEntry {
  title: string;
  subtitle?: string;
  icon?: { name: string; category?: string };
}

export interface ListProps {
  items: ListEntry[];
  variant?: "icon" | "number";
  heading?: string;
  description?: string;
}

export function List({ items, variant = "number", heading, description }: ListProps) {
  return (
    <div className={clsx(styles.root, names.root)}>
      {(heading || description) && (
        <div>
          {heading && <strong>{heading}</strong>}
          {description && <span>{description}</span>}
        </div>
      )}
      <ListBlock variant={variant}>
        {items.map((item, index) => (
          <BaseListItem
            key={index}
            variant={variant}
            title={<InlineMarkdownRenderer content={item.title} />}
            subtitle={
              item.subtitle ? <InlineMarkdownRenderer content={item.subtitle} /> : undefined
            }
            icon={
              variant === "icon" ? (
                <IconWrapper
                  name={item.icon?.name ?? "circle-dot"}
                  category={item.icon?.category}
                  size={16}
                />
              ) : undefined
            }
          />
        ))}
      </ListBlock>
    </div>
  );
}
