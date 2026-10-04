"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import clsx from "clsx";
import { Fragment, type ReactElement } from "react";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import { TextBlockView } from "../TextBlock/TextBlockView";
import { dashboardCardHeaderPropsSchema, type DashboardCardHeaderProps } from "./schema";

function DashboardCardHeaderRenderer({
  props,
  renderNode,
}: ComponentRenderProps<DashboardCardHeaderProps>) {
  const controls = props.controls;

  return (
    <div
      className={clsx(
        `${DASHBOARD_CLASS_PREFIX}-card-header`,
        !props.subtitle && `${DASHBOARD_CLASS_PREFIX}-card-header--title-only`,
      )}
    >
      <div className={`${DASHBOARD_CLASS_PREFIX}-card-header__main`}>
        <div className={`${DASHBOARD_CLASS_PREFIX}-card-header__content`}>
          <TextBlockView
            variant={props.titleType === "number" ? "number-title-text" : "title-text"}
            primary={props.title}
            secondary={props.subtitle}
            type={props.titleType}
            size="xs"
            align="left"
          />
        </div>
      </div>
      {controls?.length ? (
        <div
          className={clsx(
            `${DASHBOARD_CLASS_PREFIX}-card-header__controls`,
            controls.length > 1 && `${DASHBOARD_CLASS_PREFIX}-card-header__controls--grouped`,
          )}
        >
          {controls.map((control, index) => (
            <Fragment key={`control-${index}`}>{renderNode(control) as ReactElement}</Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const DashboardCardHeaderComponent = defineComponent({
  name: "DashboardCardHeader",
  props: dashboardCardHeaderPropsSchema,
  description:
    'Card header for MediumCard and LargeCard. If the card has a clear leading KPI or score, prefer making that value the title with titleType "number" and use the subtitle for the label; use titleType "text" for descriptive titles.',
  component: DashboardCardHeaderRenderer,
});
