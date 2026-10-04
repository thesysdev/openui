"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import clsx from "clsx";
import { Card } from "../../../../components/Card";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import { IconTagView } from "../IconTag/IconTagView";
import type { IconTagProps } from "../IconTag/schema";
import { TextBlockView } from "../TextBlock/TextBlockView";
import { resolveTrend } from "../Trend/Trend";
import { smallCardPropsSchema, type SmallCardProps } from "./schema";

type SnippetLhs = {
  title: string;
  subtitle?: string;
  icon?: unknown;
  iconVariant?: string;
  imageSrc?: string;
  imageAlt?: string;
};

type SnippetRhs = {
  value: string;
  subtext?: string;
  variant?: string;
  subtextVariant?: string;
};

function isSnippetLhs(value: unknown): value is SnippetLhs {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    typeof (value as SnippetLhs).title === "string"
  );
}

function isSnippetRhs(value: unknown): value is SnippetRhs {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof (value as SnippetRhs).value === "string"
  );
}

function SmallCardTitleMetricContent({
  title,
  metric,
  trend,
}: {
  title: string;
  metric: string;
  /** Trend(direction, value) child — resolveTrend also accepts the legacy
   *  raw `{direction, value}` object shape. */
  trend?: unknown;
}) {
  const trendObj = resolveTrend(trend);
  const isPositive = trendObj?.direction === "up";
  const isNegative = trendObj?.direction === "down";

  return (
    <div
      className={`${DASHBOARD_CLASS_PREFIX}-small-card ${DASHBOARD_CLASS_PREFIX}-small-card--title-metric`}
    >
      <div className={`${DASHBOARD_CLASS_PREFIX}-small-card__title`}>{title}</div>
      <div className={`${DASHBOARD_CLASS_PREFIX}-small-card__metric-row`}>
        <div className={`${DASHBOARD_CLASS_PREFIX}-small-card__metric`}>{metric}</div>
        {trendObj?.value !== undefined && (
          <div
            className={clsx(
              `${DASHBOARD_CLASS_PREFIX}-small-card__trend`,
              isPositive && `${DASHBOARD_CLASS_PREFIX}-small-card__trend--success`,
              isNegative && `${DASHBOARD_CLASS_PREFIX}-small-card__trend--danger`,
            )}
          >
            {isPositive ? "+" : isNegative ? "-" : ""}
            {trendObj.value}%
          </div>
        )}
      </div>
    </div>
  );
}

function SmallCardSnippetContent({ lhs, rhs }: { lhs: SnippetLhs; rhs: SnippetRhs }) {
  const rhsBlockVariant =
    rhs.subtextVariant === "metric" ? "highlight-text-number-subtext" : "text-subtext";

  return (
    <div
      className={clsx(
        `${DASHBOARD_CLASS_PREFIX}-small-card-snippet`,
        `${DASHBOARD_CLASS_PREFIX}-small-card-snippet--static`,
      )}
    >
      <div className={`${DASHBOARD_CLASS_PREFIX}-small-card-snippet__lhs`}>
        {lhs["icon"] ? (
          <IconTagView
            icon={lhs["icon"] as IconTagProps["icon"]}
            variant={(lhs.iconVariant ?? "neutral") as IconTagProps["variant"]}
            size="l"
          />
        ) : lhs.imageSrc ? (
          <img
            className={`${DASHBOARD_CLASS_PREFIX}-small-card-snippet__image`}
            src={lhs.imageSrc}
            alt={lhs.imageAlt ?? lhs.title}
          />
        ) : null}
        <div className={`${DASHBOARD_CLASS_PREFIX}-small-card-snippet__lhs-content`}>
          <TextBlockView
            variant="text-subtext"
            primary={lhs.title}
            secondary={lhs.subtitle}
            type="text"
            size="md"
            align="left"
          />
        </div>
      </div>
      <div className={`${DASHBOARD_CLASS_PREFIX}-small-card-snippet__rhs`}>
        <div className={`${DASHBOARD_CLASS_PREFIX}-small-card-snippet__rhs-content`}>
          <TextBlockView
            variant={rhsBlockVariant}
            primary={rhs.value}
            secondary={rhs.subtext}
            type={(rhs.variant as "text" | "number" | "textOnly" | undefined) ?? "text"}
            size="md"
            align="right"
            secondaryTone={
              rhs.subtextVariant === "metric" && rhs.subtext?.startsWith("+")
                ? "positive"
                : rhs.subtextVariant === "metric" && rhs.subtext?.startsWith("-")
                  ? "negative"
                  : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}

function SmallCardRenderer({ props, renderNode }: ComponentRenderProps<SmallCardProps>) {
  const isTitleMetricCard = typeof props.top === "string" && typeof props.bottom === "string";
  const snippetLhs = isSnippetLhs(props.top) ? props.top : undefined;
  const isSnippetCard = snippetLhs !== undefined && isSnippetRhs(props.bottom);
  const snippetRhs = isSnippetRhs(props.bottom) ? props.bottom : undefined;

  if (isTitleMetricCard) {
    return (
      <Card
        width="full"
        variant="card"
        className={`${DASHBOARD_CLASS_PREFIX}-shell-card ${DASHBOARD_CLASS_PREFIX}-shell-card--small`}
      >
        <SmallCardTitleMetricContent
          title={props.top as string}
          metric={props.bottom as string}
          trend={props.trend}
        />
      </Card>
    );
  }

  if (isSnippetCard && snippetRhs) {
    return (
      <Card
        width="full"
        variant="card"
        className={`${DASHBOARD_CLASS_PREFIX}-shell-card ${DASHBOARD_CLASS_PREFIX}-shell-card--small ${DASHBOARD_CLASS_PREFIX}-shell-card--small-snippet`}
      >
        <SmallCardSnippetContent lhs={snippetLhs} rhs={snippetRhs} />
      </Card>
    );
  }

  return (
    <Card
      width="full"
      variant="card"
      className={`${DASHBOARD_CLASS_PREFIX}-shell-card ${DASHBOARD_CLASS_PREFIX}-shell-card--small`}
    >
      <div className={`${DASHBOARD_CLASS_PREFIX}-small-card`}>
        <div
          className={`${DASHBOARD_CLASS_PREFIX}-small-card__slot ${DASHBOARD_CLASS_PREFIX}-small-card__slot--top`}
        >
          {renderNode(props.top)}
        </div>
        <div
          className={`${DASHBOARD_CLASS_PREFIX}-small-card__slot ${DASHBOARD_CLASS_PREFIX}-small-card__slot--bottom`}
        >
          {renderNode(props.bottom ?? [])}
        </div>
      </div>
    </Card>
  );
}

export const SmallCardComponent = defineComponent({
  name: "SmallCard",
  props: smallCardPropsSchema,
  description:
    "Compact dashboard card with three named forms — top and bottom must pair up; never mix forms across slots. Overview card with icon: SmallCard(IconText(Icon(...), iconVariant), [MetricIndicator(value, label, trend?)]) for a metric that has a clear universal symbol. Overview card: SmallCard(title, metric, trend?) — title and metric are strings — for abstract, composite, or system-specific metrics without a universal icon; trend is a Trend(direction, value) child. Snippet card: SmallCard(lhs, rhs) for compact entity, task, account, or status rows; lhs is a non-emphasized raw object with title plus icon (a lucide name string) or imageSrc, and rhs is a required raw object with an emphasized value.",
  component: SmallCardRenderer,
});
