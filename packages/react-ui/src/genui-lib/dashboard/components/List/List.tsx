"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { ListBlock } from "../../../../components/ListBlock";
import { ListItem as OpenUIListItem } from "../../../../components/ListItem";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import { IconWrapper } from "../Icon/IconWrapper";
import { InlineMarkdownRenderer } from "../InlineMarkdownRenderer/InlineMarkdownRenderer";
import { listPropsSchema, type ListItemType, type ListProps, type ListRenderProps } from "./schema";
export { ListItemComponent } from "./schema";

function ListItemRenderer({
  item,
  variant = "number",
  index = 0,
  listHasSubtitle,
}: {
  item: ListItemType;
  variant?: string;
  index?: number;
  listHasSubtitle?: boolean;
}) {
  const p = item.props;

  return (
    <OpenUIListItem
      variant={variant as "icon" | "number"}
      index={index}
      listHasSubtitle={listHasSubtitle}
      title={<InlineMarkdownRenderer content={p.title} />}
      subtitle={p.subtitle ? <InlineMarkdownRenderer content={p.subtitle} /> : undefined}
      icon={
        variant === "icon" ? (
          <IconWrapper
            name={p.icon?.props.name ?? "circle-dot"}
            category={p.icon?.props.category}
            size={16}
          />
        ) : undefined
      }
    />
  );
}

function ListRenderer({ props }: ComponentRenderProps<ListProps>) {
  const items = props.items ?? [];
  const variant = props.variant ?? "number";
  const size = (props as ListRenderProps).size ?? "default";

  const listHasSubtitle = items.some((item) => !!item.props.subtitle);

  return (
    <div className={`${DASHBOARD_CLASS_PREFIX}-list ${DASHBOARD_CLASS_PREFIX}-list--${size}`}>
      {(props.heading || props.description) && (
        <div>
          {props.heading && <strong>{props.heading}</strong>}
          {props.description && <span>{props.description}</span>}
        </div>
      )}
      <ListBlock variant={variant}>
        {items.map((item, index) => (
          <ListItemRenderer
            key={index}
            item={item}
            variant={variant}
            listHasSubtitle={listHasSubtitle}
          />
        ))}
      </ListBlock>
    </div>
  );
}

export const ListComponent = defineComponent({
  name: "List",
  props: listPropsSchema,
  description: "",
  component: ListRenderer,
});
