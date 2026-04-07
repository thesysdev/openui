interface TextContentProps {
  text: string;
  tone?: "normal" | "muted" | "strong";
}

export function TextContent(props: { props: TextContentProps }) {
  const tone = props.props.tone || "normal";
  const color = tone === "strong" ? "#0f172a" : tone === "muted" ? "#64748b" : "#334155";
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
