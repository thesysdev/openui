interface MetricItem {
  label: string;
  value: string;
}

interface MetricListProps {
  title: string;
  items: MetricItem[];
}

export function MetricList(props: { props: MetricListProps }) {
  return (
    <section
      style={{
        border: "1px solid rgba(148,163,184,0.28)",
        "border-radius": "12px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          background: "#f8fafc",
          "font-size": "12px",
          "font-weight": 700,
          color: "#334155",
          "letter-spacing": "0.02em",
          "text-transform": "uppercase",
        }}
      >
        {props.props.title}
      </div>
      <div style={{ display: "grid" }}>
        {props.props.items.map((item, idx) => (
          <div
            style={{
              display: "grid",
              "grid-template-columns": "1fr auto",
              gap: "10px",
              padding: "10px 12px",
              "border-top": idx === 0 ? "none" : "1px solid rgba(148,163,184,0.2)",
            }}
          >
            <span style={{ color: "#475569", "font-size": "13px" }}>{item.label}</span>
            <strong
              style={{
                color: "#0f172a",
                "font-size": "13px",
                "overflow-wrap": "anywhere",
                "word-break": "break-word",
                "text-align": "right",
              }}
            >
              {item.value}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}
