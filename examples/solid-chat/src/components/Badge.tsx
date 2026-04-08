interface BadgeProps {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

const toneStyles: Record<
  NonNullable<BadgeProps["tone"]>,
  { bg: string; fg: string; border: string }
> = {
  neutral: { bg: "#f1f5f9", fg: "#334155", border: "#cbd5e1" },
  success: { bg: "#dcfce7", fg: "#166534", border: "#86efac" },
  warning: { bg: "#fef3c7", fg: "#92400e", border: "#fde68a" },
  danger: { bg: "#fee2e2", fg: "#991b1b", border: "#fecaca" },
  info: { bg: "#dbeafe", fg: "#1e40af", border: "#93c5fd" },
};

export function Badge(props: { props: BadgeProps }) {
  const tone = props.props.tone || "neutral";
  const style = toneStyles[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "4px 10px",
        "font-size": "12px",
        "font-weight": 600,
        "border-radius": "999px",
        background: style.bg,
        color: style.fg,
        border: `1px solid ${style.border}`,
      }}
    >
      {props.props.label}
    </span>
  );
}
