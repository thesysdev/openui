interface TimelineItem {
  title: string;
  detail: string;
  status?: "done" | "active" | "next";
}

interface TimelineProps {
  title: string;
  items: TimelineItem[];
}

const dotColor: Record<NonNullable<TimelineItem["status"]>, string> = {
  done: "#16a34a",
  active: "#2563eb",
  next: "#94a3b8",
};

export function Timeline(props: { props: TimelineProps }) {
  return (
    <section style={{ display: "grid", gap: "8px" }}>
      <div style={{ "font-size": "13px", "font-weight": 700, color: "#1e293b" }}>
        {props.props.title}
      </div>
      <div style={{ display: "grid", gap: "10px" }}>
        {props.props.items.map((item) => {
          const status = item.status || "next";
          return (
            <div
              style={{
                display: "grid",
                "grid-template-columns": "14px 1fr",
                gap: "10px",
                padding: "8px 10px",
                border: "1px solid rgba(148,163,184,0.22)",
                "border-radius": "10px",
                background: "#ffffff",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  "border-radius": "999px",
                  background: dotColor[status],
                  margin: "5px 0 0",
                }}
              />
              <div style={{ display: "grid", gap: "2px" }}>
                <strong style={{ "font-size": "13px", color: "#0f172a" }}>{item.title}</strong>
                <span style={{ "font-size": "12px", color: "#64748b" }}>{item.detail}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
