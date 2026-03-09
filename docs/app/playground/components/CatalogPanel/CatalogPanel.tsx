"use client";

import type { ComponentGroup } from "@openuidev/lang-react";
import { openuiLibrary } from "@openuidev/react-ui";
import { ChevronLeft, ChevronRight, LayoutList } from "lucide-react";
import { useState } from "react";
import "./CatalogPanel.css";

const jsonSchemas = openuiLibrary.toJSONSchema() as Record<string, any>;

function getPropType(schemaProp: any): string {
  if (!schemaProp) return "any";

  // Unwrap anyOf — Zod optional fields sometimes emit { anyOf: [realType, {type:"null"}] }
  if (schemaProp.anyOf) {
    const nonNull = schemaProp.anyOf.find((s: any) => s.type !== "null" && s !== null);
    return nonNull ? getPropType(nonNull) : "any";
  }

  if (schemaProp.$ref) {
    return schemaProp.$ref.replace(/^.*\//, "");
  }

  if (schemaProp.enum) {
    const vals = schemaProp.enum as string[];
    const joined = vals.map((v) => `"${v}"`).join(" | ");
    return joined;
  }

  if (schemaProp.type === "array") {
    const itemType = schemaProp.items ? getPropType(schemaProp.items) : "any";
    return `${itemType}[]`;
  }

  if (schemaProp.type) return schemaProp.type as string;

  return "any";
}

interface PropRow {
  name: string;
  type: string;
  optional: boolean;
}

function getPropsForComponent(compName: string): PropRow[] {
  const schema = jsonSchemas[compName] as any;
  if (!schema?.properties) return [];

  const required = new Set<string>(schema.required ?? []);
  return Object.entries(schema.properties as Record<string, any>).map(([name, propSchema]) => ({
    name,
    type: getPropType(propSchema),
    optional: !required.has(name),
  }));
}

export function CatalogPanel() {
  const [expandedComp, setExpandedComp] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleChipClick = (comp: string) => {
    setExpandedComp((prev) => (prev === comp ? null : comp));
  };

  return (
    <aside className={`catalog-panel${isCollapsed ? " catalog-panel--collapsed" : ""}`}>
      <div className="catalog-panel-header">
        {!isCollapsed && <span className="catalog-panel-title">Library: OpenUI Library</span>}
        {isCollapsed && (
          <span className="catalog-panel-icon-only" title="Library: OpenUI Library">
            <LayoutList size={16} />
          </span>
        )}
        <button
          className="catalog-panel-toggle"
          onClick={() => setIsCollapsed((v) => !v)}
          aria-label={isCollapsed ? "Expand catalog" : "Collapse catalog"}
          title={isCollapsed ? "Expand catalog" : "Collapse catalog"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
      <div className={`catalog-panel-body${isCollapsed ? " catalog-panel-body--hidden" : ""}`}>
        {openuiLibrary.componentGroups!.map((group: ComponentGroup) => {
          const groupExpanded = expandedComp !== null && group.components.includes(expandedComp);
          const props = groupExpanded ? getPropsForComponent(expandedComp!) : [];

          return (
            <div key={group.name} className="catalog-group">
              <div className="catalog-group-name">{group.name}</div>
              <div className="catalog-chips">
                {group.components.map((comp: string) => {
                  const desc = openuiLibrary.components[comp]?.description;
                  const isActive = expandedComp === comp;
                  return (
                    <span
                      key={comp}
                      className={`catalog-chip${isActive ? " catalog-chip--active" : ""}`}
                      title={desc || undefined}
                      onClick={() => handleChipClick(comp)}
                    >
                      {comp}
                    </span>
                  );
                })}
              </div>

              {groupExpanded && (
                <div className="catalog-prop-panel">
                  <div className="catalog-prop-panel-header">
                    <span className="catalog-prop-comp-name">{expandedComp}</span>
                    {openuiLibrary.components[expandedComp!]?.description && (
                      <p className="catalog-prop-desc">
                        {openuiLibrary.components[expandedComp!].description}
                      </p>
                    )}
                  </div>
                  {props.length > 0 ? (
                    <div className="catalog-prop-list">
                      {props.map((row) => (
                        <div key={row.name} className="catalog-prop-row">
                          <span className="catalog-prop-name">
                            {row.optional ? row.name : `${row.name}*`}
                          </span>
                          <span className="catalog-prop-type" title={row.type}>
                            {row.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="catalog-prop-empty">No props</p>
                  )}
                </div>
              )}

              {group.notes && (
                <div className="catalog-notes">
                  {group.notes.map((note: string, i: number) => (
                    <p key={i} className="catalog-note">
                      {note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
