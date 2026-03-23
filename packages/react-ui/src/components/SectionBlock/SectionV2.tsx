import React from "react";
import { Separator } from "../Separator";

interface SectionV2Props {
  trigger: string;
  children?: React.ReactNode;
}

export const SectionV2 = ({ trigger, children }: SectionV2Props) => {
  return (
    <div className="openui-section-v2">
      <div className="openui-section-v2-wrapper">
        <Separator orientation="horizontal" />
        <div className="openui-section-v2-header">
          <div className="openui-section-v2-header-trigger">{trigger}</div>
        </div>
        <div className="openui-section-v2-content">{children}</div>
      </div>
    </div>
  );
};
