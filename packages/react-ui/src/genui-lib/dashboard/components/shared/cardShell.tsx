"use client";

import { type ComponentRenderProps, useIsStreaming } from "@openuidev/react-lang";
import clsx from "clsx";
import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod/v4";
import { Button } from "../../../../components/Button";
import { Card } from "../../../../components/Card";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import { ButtonComponent } from "../Button/Button";
import { ButtonGroupComponent } from "../ButtonGroup/ButtonGroup";
import { CalloutComponent } from "../Callout/Callout";
import { DashboardCardHeaderComponent } from "../DashboardCardHeader/DashboardCardHeader";
import { AreaChartComponent } from "../DashboardCharts/AreaChart/AreaChart";
import { BarChartComponent } from "../DashboardCharts/BarChart/BarChart";
import { HorizontalBarChartComponent } from "../DashboardCharts/HorizontalBarChart/HorizontalBarChart";
import { LineChartComponent } from "../DashboardCharts/LineChart/LineChart";
import { PieChartComponent } from "../DashboardCharts/PieChart/PieChart";
import { RadarChartComponent } from "../DashboardCharts/RadarChart/RadarChart";
import { RadialChartComponent } from "../DashboardCharts/RadialChart/RadialChart";
import { ScatterChartComponent } from "../DashboardCharts/ScatterChart/ScatterChart";
import { EntityListComponent } from "../EntityList/EntityList";
import { ImageBlockComponent } from "../ImageBlock/ImageBlock";
import { ListComponent } from "../List/List";
import { MarkDownRendererComponent } from "../MarkDownRenderer/MarkDownRenderer";
import { MetricIndicatorComponent } from "../MetricIndicator/MetricIndicator";
import { TableComponent } from "../Table/Table";
import { TagBlockComponent } from "../TagBlock/TagBlock";
import { TextCalloutComponent } from "../TextCallout/TextCallout";
import { TextContentComponent } from "../TextContent/TextContent";

export const mediumCardChildSchema = z.union([
  DashboardCardHeaderComponent.ref,
  BarChartComponent.ref,
  LineChartComponent.ref,
  AreaChartComponent.ref,
  RadarChartComponent.ref,
  HorizontalBarChartComponent.ref,
  PieChartComponent.ref,
  RadialChartComponent.ref,
  ScatterChartComponent.ref,
  TableComponent.ref,
  MetricIndicatorComponent.ref,
  TextContentComponent.ref,
  MarkDownRendererComponent.ref,
  CalloutComponent.ref,
  TextCalloutComponent.ref,
  ImageBlockComponent.ref,
  TagBlockComponent.ref,
  ButtonComponent.ref,
  ButtonGroupComponent.ref,
  ListComponent.ref,
  EntityListComponent.ref,
]);

export const largeCardChildSchema = z.union([
  DashboardCardHeaderComponent.ref,
  BarChartComponent.ref,
  LineChartComponent.ref,
  AreaChartComponent.ref,
  HorizontalBarChartComponent.ref,
  ScatterChartComponent.ref,
  TableComponent.ref,
  MetricIndicatorComponent.ref,
  TextContentComponent.ref,
  MarkDownRendererComponent.ref,
  CalloutComponent.ref,
  TextCalloutComponent.ref,
  ImageBlockComponent.ref,
  TagBlockComponent.ref,
  ButtonComponent.ref,
  ButtonGroupComponent.ref,
  ListComponent.ref,
  EntityListComponent.ref,
]);

export const createCardPropsSchema = (childSchema: z.ZodTypeAny) =>
  z.object({
    children: z.array(childSchema).default([]),
    collapsed: z.boolean().default(false),
  });

type AppCardProps = {
  children: unknown[];
  collapsed: boolean;
};

export type AppCardSize = "small" | "medium" | "large";

function normalizeCardChildren(children: unknown[], size: AppCardSize) {
  return children.map((child) => {
    if (
      typeof child !== "object" ||
      child === null ||
      (child as { type?: string }).type !== "element"
    ) {
      return child;
    }

    const typeName = (child as { typeName?: string }).typeName;
    const props = (child as { props?: Record<string, unknown> }).props;

    if (size === "medium" && typeName === PieChartComponent.name) {
      return {
        ...child,
        props: {
          ...props,
          legendVariant: "stacked",
        },
      };
    }

    return child;
  });
}

function getCardTitle(children: unknown[]) {
  const header = children.find(
    (child) =>
      typeof child === "object" &&
      child !== null &&
      (child as { typeName?: string }).typeName === DashboardCardHeaderComponent.name,
  ) as { props?: { title?: unknown } } | undefined;

  return typeof header?.props?.title === "string" ? header.props.title : "Card details";
}

export function AppCardRenderer({
  props,
  renderNode,
  size,
}: ComponentRenderProps<AppCardProps> & {
  size: AppCardSize;
}) {
  const isStreaming = useIsStreaming();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const normalizedChildren = normalizeCardChildren(props.children, size);
  const collapseRequested = size !== "small" && props.collapsed === true;
  const showCollapseControl = collapseRequested && isOverflowing;
  const isCollapsed = collapseRequested;
  const modalTitle = getCardTitle(props.children);

  useEffect(() => {
    if (!collapseRequested) {
      setIsModalOpen(false);
      setIsOverflowing(false);
      return;
    }

    const contentElement = contentRef.current;
    if (!contentElement) {
      return;
    }

    const wrapElement = contentElement.parentElement;

    const updateOverflowState = () => {
      if (!wrapElement) return;
      setIsOverflowing(
        wrapElement.clientHeight > 0 && contentElement.scrollHeight > wrapElement.clientHeight + 1,
      );
    };

    updateOverflowState();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(updateOverflowState);
    resizeObserver.observe(contentElement);

    return () => resizeObserver.disconnect();
  }, [collapseRequested]);

  useEffect(() => {
    if (!showCollapseControl) {
      setIsModalOpen(false);
    }
  }, [showCollapseControl]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  return (
    <Card
      width="full"
      variant="card"
      className={clsx(
        `${DASHBOARD_CLASS_PREFIX}-shell-card`,
        `${DASHBOARD_CLASS_PREFIX}-shell-card--${size}`,
        isStreaming && `${DASHBOARD_CLASS_PREFIX}-shell-card--streaming`,
        collapseRequested && `${DASHBOARD_CLASS_PREFIX}-shell-card--collapse-requested`,
        isCollapsed && `${DASHBOARD_CLASS_PREFIX}-shell-card--collapsed`,
      )}
    >
      <div className={`${DASHBOARD_CLASS_PREFIX}-shell-card__content-wrap`}>
        <div ref={contentRef} className={`${DASHBOARD_CLASS_PREFIX}-shell-card__content`}>
          {renderNode(normalizedChildren)}
        </div>
        {showCollapseControl && (
          <div
            className={`${DASHBOARD_CLASS_PREFIX}-shell-card__collapse-fade`}
            aria-hidden="true"
          />
        )}
      </div>
      {showCollapseControl && (
        <div className={`${DASHBOARD_CLASS_PREFIX}-shell-card__collapse-control`}>
          <Button
            variant="secondary"
            size="small"
            buttonType="normal"
            iconLeft={<Maximize2 size={14} />}
            onClick={() => setIsModalOpen(true)}
          >
            Expand
          </Button>
        </div>
      )}
      {isModalOpen && (
        <div
          className={`${DASHBOARD_CLASS_PREFIX}-shell-card-modal`}
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle}
        >
          <button
            type="button"
            className={`${DASHBOARD_CLASS_PREFIX}-shell-card-modal__overlay`}
            aria-label="Minimize expanded card"
            onClick={() => setIsModalOpen(false)}
          />
          <div className={`${DASHBOARD_CLASS_PREFIX}-shell-card-modal__frame`}>
            <div className={`${DASHBOARD_CLASS_PREFIX}-shell-card-modal__minimize`}>
              <Button
                variant="secondary"
                size="small"
                buttonType="normal"
                iconLeft={<Minimize2 size={14} />}
                onClick={() => setIsModalOpen(false)}
              >
                Minimize
              </Button>
            </div>
            <div className={`${DASHBOARD_CLASS_PREFIX}-shell-card-modal__content`}>
              <div className={`${DASHBOARD_CLASS_PREFIX}-shell-card-modal__body`}>
                <div className={`${DASHBOARD_CLASS_PREFIX}-shell-card__content`}>
                  {renderNode(normalizedChildren)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
