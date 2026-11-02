import {
  OverviewCardBlock as BaseOverviewCardBlock,
  IconText,
  ImageText,
  TextBlockView,
} from "@openuidev/react-components";
import clsx from "clsx";
import { names, styles } from "./overviewCardBlock.styles";

export interface OverviewCardItem {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: string;
  imageSrc?: string;
  imageAlt?: string;
  value?: string;
  valueSubtext?: string;
  trend?: { direction: "up" | "down"; value: number };
}

export interface OverviewCardBlockProps {
  items: OverviewCardItem[];
  layout?: "grid" | "carousel";
  responsive?: boolean;
  gap?: number | string;
}

function cardTop({ title, subtitle, icon, imageSrc, imageAlt }: OverviewCardItem) {
  if (imageSrc)
    return <ImageText src={imageSrc} alt={imageAlt} title={title} subtitle={subtitle} />;
  if (icon) return <IconText icon={{ name: icon }} title={title} subtitle={subtitle} />;
  return (
    <TextBlockView
      variant={subtitle ? "text-subtext" : "text"}
      primary={title}
      secondary={subtitle}
      type="text"
      size="xs"
      align="left"
    />
  );
}

/** Maps the flat item props the model emits onto react-components' card slots. */
export function OverviewCardBlock({ items, layout, responsive, gap }: OverviewCardBlockProps) {
  return (
    <BaseOverviewCardBlock
      className={clsx(styles.root, names.root)}
      layout={layout}
      responsive={responsive}
      gap={gap}
      items={items.map((item) => ({
        id: item.id,
        top: cardTop(item),
        bottom:
          item.value || item.valueSubtext || item.trend
            ? { value: item.value ?? "", subtext: item.valueSubtext, trend: item.trend }
            : undefined,
      }))}
    />
  );
}
