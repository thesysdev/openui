"use client";

import type { ReactNode } from "react";
import { InputIntro } from "../input-intro";
import { RadioInput } from "../radio-input";
import { Sidebar } from "./sidebar";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarCollapseButton } from "./sidebar-collapse-button";
import { DriversIcon, HomeIcon, RadioIcon } from "./sidebar-icons";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarSectionLabel } from "./sidebar-section-label";
import { SidebarShell } from "./sidebar-shell";
import { SidebarThreadItem } from "./sidebar-thread-item";

// Each piece is shown on a carbon strip the width of the sidebar, since that's where it lives.
function Specimen({ rows }: { rows: { label: string; view: ReactNode }[] }) {
  return (
    <div className="f1-sidebar-specimen">
      {rows.map(({ label, view }) => (
        <div key={label} className="f1-sidebar-specimen__row">
          <span>{label}</span>
          <div className="f1-sidebar-specimen__swatch">{view}</div>
        </div>
      ))}
    </div>
  );
}

// The sidebar beside the /design chat page: white, no header, the compact RadioInput at the bottom.
export function SidebarPreview() {
  return (
    <div className="f1-sidebar-stage">
      <Sidebar floating />
      <div className="f1-sidebar-stage__page">
        <h3>Home</h3>
        <div className="f1-sidebar-stage__input">
          <InputIntro>
            <RadioInput size="compact" />
          </InputIntro>
        </div>
      </div>
    </div>
  );
}

export function SidebarShellPreview() {
  return (
    <div style={{ display: "flex", gap: 32, height: 480 }}>
      <SidebarShell textured>{null}</SidebarShell>
      <SidebarShell>{null}</SidebarShell>
    </div>
  );
}

export function SidebarBrandPreview() {
  return <Specimen rows={[{ label: "Default", view: <SidebarBrand /> }]} />;
}

export function SidebarCollapseButtonPreview() {
  return (
    <Specimen
      rows={[
        { label: "Expanded (collapses)", view: <SidebarBrand onToggleCollapsed={() => {}} /> },
        { label: "Button alone", view: <SidebarCollapseButton /> },
      ]}
    />
  );
}

export function SidebarNavItemPreview() {
  return (
    <Specimen
      rows={[
        { label: "Rest (hover for white)", view: <SidebarNavItem label="Drivers" icon={<DriversIcon />} /> },
        { label: "Active", view: <SidebarNavItem label="Home" icon={<HomeIcon />} active /> },
        { label: "No icon", view: <SidebarNavItem label="Standings" /> },
      ]}
    />
  );
}

export function SidebarSectionLabelPreview() {
  return (
    <Specimen
      rows={[
        { label: "With icon", view: <SidebarSectionLabel label="Team Radio" icon={<RadioIcon />} /> },
        { label: "Label only", view: <SidebarSectionLabel label="Team Radio" /> },
      ]}
    />
  );
}

export function SidebarThreadItemPreview() {
  const icon = <RadioIcon size={18} color="currentColor" />;
  return (
    <Specimen
      rows={[
        { label: "Rest (hover for white)", view: <SidebarThreadItem title="Monaco qualifying gaps to pole" meta="Mon" icon={icon} /> },
        { label: "Active", view: <SidebarThreadItem title="Verstappen vs Norris race pace in 2024" meta="Today" icon={icon} active /> },
        {
          label: "Long title",
          view: <SidebarThreadItem title="Every driver who scored points in the wet at Interlagos since 2008" meta="Last week" icon={icon} />,
        },
        { label: "No icon", view: <SidebarThreadItem title="Who has the most wins at Monza?" meta="Today" /> },
      ]}
    />
  );
}
