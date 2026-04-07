import { createSignal, onCleanup, onMount, type JSX } from "solid-js";

interface StackProps {
  children: unknown[];
}

function getTypeName(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  return (value as { typeName?: string }).typeName;
}

export function Stack(props: { props: StackProps; renderNode: (value: unknown) => JSX.Element }) {
  const [isCompact, setIsCompact] = createSignal(false);
  const childTypes = props.props.children.map(getTypeName);
  const isActionRow = childTypes.length > 0 && childTypes.every((name) => name === "Button");

  const spanByType: Record<string, string> = {
    TextContent: "1 / -1",
    Stack: "1 / -1",
    Card: "span 6",
    Chart: "span 6",
    KpiTile: "span 3",
    MetricList: "span 6",
    Timeline: "span 6",
    Badge: "span 2",
    Button: "span 3",
  };

  onMount(() => {
    const onResize = () => setIsCompact(window.innerWidth < 900);
    onResize();
    window.addEventListener("resize", onResize);
    onCleanup(() => window.removeEventListener("resize", onResize));
  });

  return (
    <div
      style={{
        display: isActionRow ? "flex" : "grid",
        gap: isActionRow ? "10px" : "14px",
        "flex-wrap": isActionRow ? "wrap" : undefined,
        "grid-template-columns": isActionRow
          ? undefined
          : isCompact()
            ? "repeat(1, minmax(0, 1fr))"
            : "repeat(12, minmax(0, 1fr))",
        "align-items": "start",
      }}
    >
      {props.props.children.map((child) => (
        <div
          style={
            isActionRow
              ? { flex: "0 0 auto" }
              : {
                  "grid-column": isCompact()
                    ? "1 / -1"
                    : spanByType[getTypeName(child) || ""] || "1 / -1",
                }
          }
        >
          {props.renderNode(child)}
        </div>
      ))}
    </div>
  );
}
