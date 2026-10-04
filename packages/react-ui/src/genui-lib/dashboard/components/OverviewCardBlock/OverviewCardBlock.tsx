"use client";

import { type ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import clsx from "clsx";
import type { CSSProperties } from "react";
import { z } from "zod/v4";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import { IconWrapper } from "../Icon/IconWrapper";
import { MetricIndicatorInlineView } from "../MetricIndicatorInline/MetricIndicatorInlineView";
import { getRowConfiguration, useCarouselMask } from "../smallCardsShared/smallCardBlockUtils";
import { TextBlockView } from "../TextBlock/TextBlockView";
import { resolveTrend } from "../Trend/Trend";
import { OverviewCardItemComponent } from "./OverviewCardItem";

const overviewCardBlockPropsSchema = z.object({
  items: z.array(OverviewCardItemComponent.ref).min(2),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  responsive: z.boolean().default(true),
  gap: z.union([z.number(), z.string()]).optional(),
});

type OverviewCardBlockProps = z.infer<typeof overviewCardBlockPropsSchema>;
type OverviewCardItem = OverviewCardBlockProps["items"][number];
type SmallCardGapStyle = CSSProperties & {
  [key in `--${typeof DASHBOARD_CLASS_PREFIX}-small-card-gap`]?: string;
};

/** Text-slot guard: positional miscounts can shift a component node (e.g.
 *  Trend(...)) into a string prop — rendering an object as a React child
 *  crashes the whole block. Coerce to text or drop. */
const asText = (v: unknown): string | undefined =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : undefined;

function OverviewCardTopContent({ item }: { item: OverviewCardItem }) {
  const { imageSrc, icon } = item.props;
  const title = asText(item.props.title) ?? "";
  const subtitle = asText(item.props.subtitle);
  const imageAlt = asText(item.props.imageAlt);
  const hasVisual = Boolean(imageSrc || icon);

  const textBlock = (
    <TextBlockView
      variant={subtitle ? "text-subtext" : "text"}
      primary={title}
      secondary={subtitle}
      type="text"
      size="xs"
      align="left"
    />
  );

  if (!hasVisual) return textBlock;

  return (
    <div
      className={`${DASHBOARD_CLASS_PREFIX}-image-text ${DASHBOARD_CLASS_PREFIX}-image-text--horizontal`}
    >
      <div
        className={clsx(
          `${DASHBOARD_CLASS_PREFIX}-image-text__image-container`,
          !imageSrc && icon && `${DASHBOARD_CLASS_PREFIX}-overview-card__icon-badge`,
        )}
      >
        {imageSrc && (
          <img
            className={`${DASHBOARD_CLASS_PREFIX}-image-text__image`}
            src={imageSrc}
            alt={imageAlt ?? title}
          />
        )}
        {!imageSrc && icon && (
          <span className={`${DASHBOARD_CLASS_PREFIX}-overview-card__icon-badge-text`}>
            <IconWrapper name={icon} size={16} />
          </span>
        )}
      </div>
      <div className={`${DASHBOARD_CLASS_PREFIX}-image-text__content`}>{textBlock}</div>
    </div>
  );
}

function OverviewCardBlockRenderer({ props }: ComponentRenderProps<OverviewCardBlockProps>) {
  const { scrollRef, maskLeft, maskRight } = useCarouselMask();

  const items = props.items ?? [];
  const finalLayout = props.layout ?? "grid";
  const rowConfiguration = getRowConfiguration(items.length, 3);
  const gapStyle: SmallCardGapStyle | undefined = props.gap
    ? ({
        [`--${DASHBOARD_CLASS_PREFIX}-small-card-gap`]:
          typeof props.gap === "number" ? `${props.gap}px` : props.gap,
      } as SmallCardGapStyle)
    : undefined;

  const renderCard = (item: OverviewCardItem, itemIndex: number) => {
    const id = asText(item.props.id);
    const value = asText(item.props.value);
    const valueSubtext = asText(item.props.valueSubtext);
    // Trend(direction, value) child — resolveTrend also accepts the legacy
    // raw `{direction, value}` object shape.
    const trend = resolveTrend(item.props.trend);

    return (
      <div
        key={id ?? `${DASHBOARD_CLASS_PREFIX}-overview-card-${itemIndex}`}
        className={
          finalLayout === "carousel"
            ? `${DASHBOARD_CLASS_PREFIX}-small-card-block__carousel-item`
            : `${DASHBOARD_CLASS_PREFIX}-small-card-block__item`
        }
      >
        <div className={`${DASHBOARD_CLASS_PREFIX}-overview-card`}>
          <div className={`${DASHBOARD_CLASS_PREFIX}-overview-card__vertical`}>
            <div className={`${DASHBOARD_CLASS_PREFIX}-overview-card__top-row`}>
              <div
                className={`${DASHBOARD_CLASS_PREFIX}-overview-card__slot ${DASHBOARD_CLASS_PREFIX}-overview-card__slot--top`}
              >
                <OverviewCardTopContent item={item} />
              </div>
            </div>
            {(value || valueSubtext || trend) && (
              <div
                className={`${DASHBOARD_CLASS_PREFIX}-overview-card__slot ${DASHBOARD_CLASS_PREFIX}-overview-card__slot--bottom`}
              >
                <MetricIndicatorInlineView
                  value={value ?? ""}
                  subtext={valueSubtext}
                  trend={trend}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  let rowStartIndex = 0;

  return (
    <div
      className={clsx(
        `${DASHBOARD_CLASS_PREFIX}-small-card-block`,
        `${DASHBOARD_CLASS_PREFIX}-small-card-block--overview-card`,
        `${DASHBOARD_CLASS_PREFIX}-small-card-block--${finalLayout}`,
      )}
      data-card-type="OverviewCard"
      data-layout={finalLayout}
      data-count={items.length}
      style={gapStyle}
    >
      {finalLayout === "carousel" ? (
        <div
          ref={scrollRef}
          className={clsx(
            `${DASHBOARD_CLASS_PREFIX}-small-card-block__carousel`,
            props.responsive !== false &&
              `${DASHBOARD_CLASS_PREFIX}-small-card-block__carousel--responsive`,
            maskLeft && `${DASHBOARD_CLASS_PREFIX}-small-card-block__carousel--mask-left`,
            maskRight && `${DASHBOARD_CLASS_PREFIX}-small-card-block__carousel--mask-right`,
          )}
        >
          <div className={`${DASHBOARD_CLASS_PREFIX}-small-card-block__carousel-track`}>
            {items.map((item, index) => renderCard(item, index))}
          </div>
        </div>
      ) : (
        <div
          className={clsx(
            `${DASHBOARD_CLASS_PREFIX}-small-card-block__grid`,
            props.responsive !== false &&
              `${DASHBOARD_CLASS_PREFIX}-small-card-block__grid--responsive`,
            props.responsive !== false &&
              items.length % 2 === 1 &&
              `${DASHBOARD_CLASS_PREFIX}-small-card-block__grid--odd-count`,
          )}
        >
          {rowConfiguration.map((itemsInRow, rowIndex) => {
            const rowItems = items.slice(rowStartIndex, rowStartIndex + itemsInRow);
            const currentRowStartIndex = rowStartIndex;
            rowStartIndex += itemsInRow;

            return (
              <div
                key={`${DASHBOARD_CLASS_PREFIX}-overview-card-row-${rowIndex}`}
                className={clsx(
                  `${DASHBOARD_CLASS_PREFIX}-small-card-block__row`,
                  `${DASHBOARD_CLASS_PREFIX}-small-card-block__row--${itemsInRow}`,
                )}
              >
                {rowItems.map((item, columnIndex) =>
                  renderCard(item, currentRowStartIndex + columnIndex),
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const OverviewCardBlockComponent = defineComponent({
  name: "OverviewCardBlock",
  props: overviewCardBlockPropsSchema,
  description: "",
  component: OverviewCardBlockRenderer,
});
