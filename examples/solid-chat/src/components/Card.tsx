import { BarChart3 } from "lucide-solid";
import type { JSX } from "solid-js";

interface CardProps {
  title: string;
  subtitle?: string;
  variant?: "default" | "glass" | "accent";
  highlight?: string;
  children: unknown[];
}

function countCharts(children: unknown[]): number {
  return children.filter(
    (child) =>
      child && typeof child === "object" && (child as { typeName?: string }).typeName === "Chart",
  ).length;
}

function isRenderableNode(child: unknown): child is { typeName: string } {
  return Boolean(
    child &&
    typeof child === "object" &&
    typeof (child as { typeName?: unknown }).typeName === "string",
  );
}

export function Card(props: { props: CardProps; renderNode: (value: unknown) => JSX.Element }) {
  const safeChildren = props.props.children.filter(isRenderableNode);
  const chartCount = countCharts(safeChildren);
  const hasChart = chartCount > 0;
  const variant = props.props.variant || "default";

  const backgroundByVariant: Record<NonNullable<CardProps["variant"]>, string> = {
    default: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)",
    glass: "linear-gradient(160deg, rgba(239,246,255,0.86) 0%, rgba(255,255,255,0.8) 100%)",
    accent: "linear-gradient(160deg, #eff6ff 0%, #f8fafc 100%)",
  };

  return (
    <section
      style={{
        "min-width": "0",
        background: backgroundByVariant[variant],
        border: "1px solid rgba(148,163,184,0.25)",
        "border-radius": "16px",
        padding: "16px",
        "box-shadow": "0 8px 26px rgba(15, 23, 42, 0.08)",
        "backdrop-filter": "blur(3px)",
      }}
    >
      <div
        style={{
          display: "flex",
          "justify-content": "space-between",
          gap: "8px",
          "align-items": "center",
          margin: "0 0 10px",
          padding: "0 0 8px",
          "border-bottom": "1px solid rgba(148,163,184,0.25)",
        }}
      >
        <div style={{ display: "inline-flex", gap: "8px", "align-items": "center" }}>
          <BarChart3 size={16} color="#334155" />
          <div>
            <h3 style={{ margin: 0, "font-size": "15px", "font-weight": 600 }}>
              {props.props.title}
            </h3>
            {props.props.subtitle ? (
              <p style={{ margin: 0, "font-size": "12px", color: "#64748b" }}>
                {props.props.subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {props.props.highlight ? (
          <span
            style={{
              "font-size": "11px",
              color: "#1d4ed8",
              background: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.22)",
              "border-radius": "999px",
              padding: "4px 8px",
              "font-weight": 600,
            }}
          >
            {props.props.highlight}
          </span>
        ) : null}
      </div>
      <div
        style={{
          display: "grid",
          gap: "10px",
          "grid-template-columns": hasChart ? "minmax(0, 1fr)" : undefined,
          "align-items": "start",
        }}
      >
        {safeChildren.map((child) => (
          <div style={{ "min-width": "0" }}>{props.renderNode(child)}</div>
        ))}
      </div>
    </section>
  );
}
