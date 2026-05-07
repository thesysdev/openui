"use client";

interface ChartSkeletonProps {
  height?: number;
}

export function ChartSkeleton({ height = 320 }: ChartSkeletonProps) {
  return (
    <div
      className="openui-plotly-skeleton"
      style={{
        width: "100%",
        height,
        borderRadius: 8,
        background:
          "linear-gradient(90deg, rgba(15,23,42,0.04) 0%, rgba(15,23,42,0.08) 50%, rgba(15,23,42,0.04) 100%)",
        backgroundSize: "200% 100%",
        animation: "openui-plotly-shimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}

interface NoDataProps {
  height?: number;
  reason?: string;
}

// Distinct from ChartSkeleton — used when streaming has finished and the chart
// genuinely received no data (e.g. an unresolved reference in the openui-lang).
export function NoDataNotice({ height = 160, reason }: NoDataProps) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: height,
        borderRadius: 8,
        border: "1px dashed rgba(15,23,42,0.16)",
        background: "rgba(15,23,42,0.02)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "16px 20px",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(15,23,42,0.65)" }}>No data</div>
      <div
        style={{
          fontSize: 11.5,
          color: "rgba(15,23,42,0.45)",
          textAlign: "center",
          maxWidth: 360,
          lineHeight: 1.45,
        }}
      >
        {reason ??
          "This chart did not receive any traces. The model may have referenced an unresolved variable."}
      </div>
    </div>
  );
}
