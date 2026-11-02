import { Card, IconTag, TextBlockView } from "@openuidev/react-components";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";
import { names as shellNames, styles as shellStyles } from "../ShellCard/shellCard.styles";
import { names, styles } from "./smallCard.styles";

type IconTagProps = ComponentProps<typeof IconTag>;

function SmallCardFrame({ snippet, children }: { snippet?: boolean; children: ReactNode }) {
  return (
    <Card
      width="full"
      variant="card"
      className={clsx(
        shellStyles.root,
        shellNames.root,
        shellStyles.size.small,
        shellNames.size.small,
        snippet && [shellStyles.snippet, shellNames.snippet],
      )}
    >
      {children}
    </Card>
  );
}

export interface SmallCardMetricProps {
  title: string;
  metric: string;
  trend?: { direction?: string; value?: number };
}

/** Overview form: a title above a metric with an optional trend. */
export function SmallCardMetric({ title, metric, trend }: SmallCardMetricProps) {
  const isPositive = trend?.direction === "up";
  const isNegative = trend?.direction === "down";

  return (
    <SmallCardFrame>
      <div className={clsx(styles.root, names.root)}>
        <div className={clsx(styles.title, names.title)}>{title}</div>
        <div className={clsx(styles.metricRow, names.metricRow)}>
          <div className={clsx(styles.metric, names.metric)}>{metric}</div>
          {trend?.value !== undefined && (
            <div
              className={clsx(
                styles.trend,
                names.trend,
                isPositive && [styles.direction.up, names.direction.up],
                isNegative && [styles.direction.down, names.direction.down],
              )}
            >
              {isPositive ? "+" : isNegative ? "-" : ""}
              {trend.value}%
            </div>
          )}
        </div>
      </div>
    </SmallCardFrame>
  );
}

export interface SmallCardSnippetProps {
  lhs: {
    title: string;
    subtitle?: string;
    icon?: IconTagProps["icon"];
    iconVariant?: IconTagProps["variant"];
    imageSrc?: string;
    imageAlt?: string;
  };
  rhs: {
    value: string;
    subtext?: string;
    variant?: "text" | "number" | "textOnly";
    subtextVariant?: string;
  };
}

/** Snippet form: an identified item on the left, one emphasised value on the right. */
export function SmallCardSnippet({ lhs, rhs }: SmallCardSnippetProps) {
  const isMetric = rhs.subtextVariant === "metric";

  return (
    <SmallCardFrame snippet>
      <div className={clsx(styles.snippet, names.snippet)}>
        <div className={clsx(styles.lhs, names.lhs)}>
          {lhs.icon ? (
            <IconTag icon={lhs.icon} variant={lhs.iconVariant ?? "neutral"} size="l" />
          ) : lhs.imageSrc ? (
            <img
              className={clsx(styles.image, names.image)}
              src={lhs.imageSrc}
              alt={lhs.imageAlt ?? lhs.title}
            />
          ) : null}
          <div className={clsx(styles.lhsContent, names.lhsContent)}>
            <TextBlockView
              className={clsx(styles.snippetText, names.snippetText)}
              overflow="truncate"
              width="fill"
              variant="text-subtext"
              primary={lhs.title}
              secondary={lhs.subtitle}
              type="text"
              size="md"
              align="left"
            />
          </div>
        </div>
        <div className={clsx(styles.rhs, names.rhs)}>
          <div className={clsx(styles.rhsContent, names.rhsContent)}>
            <TextBlockView
              className={clsx(
                isMetric ? styles.snippetMetricText : styles.snippetText,
                names.snippetText,
              )}
              overflow="truncate"
              variant={isMetric ? "highlight-text-number-subtext" : "text-subtext"}
              primary={rhs.value}
              secondary={rhs.subtext}
              type={rhs.variant ?? "text"}
              size="md"
              align="right"
              secondaryTone={
                isMetric && rhs.subtext?.startsWith("+")
                  ? "positive"
                  : isMetric && rhs.subtext?.startsWith("-")
                    ? "negative"
                    : undefined
              }
            />
          </div>
        </div>
      </div>
    </SmallCardFrame>
  );
}

export interface SmallCardSlotsProps {
  top?: ReactNode;
  bottom?: ReactNode;
}

/** Icon form: free top and bottom slots. */
export function SmallCardSlots({ top, bottom }: SmallCardSlotsProps) {
  return (
    <SmallCardFrame>
      <div className={clsx(styles.root, names.root)}>
        <div className={clsx(styles.slotTop, names.slotTop)}>{top}</div>
        <div className={clsx(styles.slotBottom, names.slotBottom)}>{bottom}</div>
      </div>
    </SmallCardFrame>
  );
}
