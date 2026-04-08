interface DividerProps {
  label?: string;
}

export function Divider(props: { props: DividerProps }) {
  if (!props.props.label) {
    return (
      <hr style={{ border: 0, height: "1px", background: "rgba(148,163,184,0.25)", margin: 0 }} />
    );
  }

  return (
    <div
      style={{
        display: "grid",
        "grid-template-columns": "1fr auto 1fr",
        gap: "10px",
        "align-items": "center",
      }}
    >
      <span style={{ height: "1px", background: "rgba(148,163,184,0.25)" }} />
      <span
        style={{
          "font-size": "11px",
          "font-weight": 700,
          color: "#64748b",
          "letter-spacing": "0.04em",
          "text-transform": "uppercase",
        }}
      >
        {props.props.label}
      </span>
      <span style={{ height: "1px", background: "rgba(148,163,184,0.25)" }} />
    </div>
  );
}
