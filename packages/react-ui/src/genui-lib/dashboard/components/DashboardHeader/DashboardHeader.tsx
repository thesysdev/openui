"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import clsx from "clsx";
import { Fragment, type ReactElement } from "react";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import { dashboardHeaderPropsSchema, type DashboardHeaderProps } from "./schema";

function DashboardHeaderRenderer({
  props,
  renderNode,
}: ComponentRenderProps<DashboardHeaderProps>) {
  const controls = props.controls;

  return (
    <header className={`${DASHBOARD_CLASS_PREFIX}-header`}>
      <div className={`${DASHBOARD_CLASS_PREFIX}-header__content`}>
        <div className={`${DASHBOARD_CLASS_PREFIX}-header__title`}>{props.title}</div>
        {props.subtitle ? (
          <div className={`${DASHBOARD_CLASS_PREFIX}-header__subtitle`}>{props.subtitle}</div>
        ) : null}
      </div>
      {controls?.length ? (
        <div
          className={clsx(
            `${DASHBOARD_CLASS_PREFIX}-header__controls`,
            controls.length > 1 && `${DASHBOARD_CLASS_PREFIX}-header__controls--grouped`,
          )}
        >
          {controls.map((control, index) => (
            <Fragment key={`control-${index}`}>{renderNode(control) as ReactElement}</Fragment>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export const DashboardHeaderComponent = defineComponent({
  name: "DashboardHeader",
  props: dashboardHeaderPropsSchema,
  description: "",
  component: DashboardHeaderRenderer,
});
