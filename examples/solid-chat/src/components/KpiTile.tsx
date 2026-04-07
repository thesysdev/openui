interface KpiTileProps {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
}

const trendColor: Record<NonNullable<KpiTileProps["trend"]>, string> = {
  up: "#15803d",
  down: "#b91c1c",
  neutral: "#334155",
};

export function KpiTile(props: { props: KpiTileProps }) {
  const trend = props.props.trend || "neutral";
  return (
    <article
      style={{
        border: "1px solid rgba(148,163,184,0.3)",
        "border-radius": "14px",
        padding: "12px 14px",
        background: "linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)",
      }}
    >
      <div style={{ "font-size": "12px", color: "#64748b", "text-transform": "uppercase" }}>
        {props.props.label}
      </div>
      <div
        style={{ "font-size": "26px", "font-weight": 700, color: "#0f172a", "line-height": 1.2 }}
      >
        {props.props.value}
      </div>
      {props.props.delta ? (
        <div style={{ "font-size": "12px", color: trendColor[trend], "font-weight": 600 }}>
          {props.props.delta}
        </div>
      ) : null}
    </article>
  );
}
