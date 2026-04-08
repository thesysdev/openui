interface TextContentProps {
  text: string;
  tone?: "normal" | "muted" | "strong" | "success" | "warning" | "danger" | "info";
}

export function TextContent(props: { props: TextContentProps }) {
  const tone = props.props.tone || "normal";
  const colorByTone: Record<NonNullable<TextContentProps["tone"]>, string> = {
    normal: "#334155",
    muted: "#64748b",
    strong: "#0f172a",
    success: "#166534",
    warning: "#92400e",
    danger: "#b91c1c",
    info: "#1d4ed8",
  };
  const color = colorByTone[tone];
  const weight = tone === "strong" ? 600 : 400;
  return (
    <p
      style={{
        margin: 0,
        color,
        "line-height": 1.6,
        "font-weight": weight,
        "font-size": "14px",
        "overflow-wrap": "anywhere",
        "word-break": "break-word",
      }}
    >
      {props.props.text}
    </p>
  );
}
