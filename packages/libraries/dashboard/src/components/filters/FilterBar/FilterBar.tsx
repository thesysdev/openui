"use client";
import { Fragment, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useStyleClasses } from "../../../shared/styleClasses";
import { ThemeContext } from "../../ThemeProvider";

/* ---------- FilterBar ---------- */

export interface FilterBarProps {
  groups: { clustered: boolean; children: ReactNode }[];
  others: ReactNode;
  toggles: ReactNode;
  searches: ReactNode;
  hasActions: boolean;
}
export function FilterBar(props: FilterBarProps) {
  const theme = useContext(ThemeContext);
  const portalStyles = useStyleClasses("filters", "shared");
  // On narrow containers the bar is a single Filters button that opens a
  // bottom tray (CSS hides the button when there is room for the full row).
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);
  return (
    <>
      <div className="openui-dashboard-filterbar" role="toolbar" aria-label="Filters">
        <button
          type="button"
          className="openui-dashboard-filterbar-menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M2.5 3.5h11l-4.3 5.1v3.2l-2.4 1.3V8.6L2.5 3.5Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
          Filters
        </button>
        <div className="openui-dashboard-filterbar-items">
          {props.groups.map((group, i) => (
            <Fragment key={i}>
              {i > 0 ? <span className="openui-dashboard-filterbar-dot" aria-hidden /> : null}
              {group.clustered ? (
                <div className="openui-dashboard-filter-group">{group.children}</div>
              ) : (
                <span style={{ display: "contents" }}>{group.children}</span>
              )}
            </Fragment>
          ))}
          <span className="openui-dashboard-filterbar-spacer" />
          {/* Compare and Search are one cluster of actions on the right. */}
          {props.hasActions ? (
            <div className="openui-dashboard-filter-group">
              {props.toggles}
              {props.searches}
            </div>
          ) : null}
        </div>
      </div>
      {open
        ? createPortal(
            <div className={`openui-dashboard-root ${portalStyles}`} style={theme?.style}>
              <div className="openui-dashboard-sheet-scrim" onClick={() => setOpen(false)} />
              <div
                className="openui-dashboard-sheet"
                role="dialog"
                aria-modal="true"
                aria-label="Filters"
              >
                <div className="openui-dashboard-sheet-head">
                  Filters
                  <button type="button" aria-label="Close" onClick={() => setOpen(false)}>
                    <svg viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path
                        d="m2.5 2.5 7 7m0-7-7 7"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="openui-dashboard-sheet-body">
                  {props.others}
                  {props.toggles}
                  {props.searches}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
