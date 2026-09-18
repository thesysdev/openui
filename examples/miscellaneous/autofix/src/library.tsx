import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";

const Header = defineComponent({
  name: "Header",
  description: "A short title for the card.",
  props: z.object({ title: z.string() }),
  component: ({ props }) => <h3 className="preview-title">{props.title}</h3>,
});

const Text = defineComponent({
  name: "Text",
  description: "A paragraph of supporting text.",
  props: z.object({ content: z.string() }),
  component: ({ props }) => <p className="preview-text">{props.content}</p>,
});

const Metric = defineComponent({
  name: "Metric",
  description: "A labeled metric. The value is a formatted string, such as $48,200 or 12%.",
  props: z.object({ label: z.string(), value: z.string(), detail: z.string().optional() }),
  component: ({ props }) => (
    <div className="preview-metric">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      {props.detail && <small>{props.detail}</small>}
    </div>
  ),
});

const Card = defineComponent({
  name: "Card",
  description: "The root container for a summary, with a title, metrics, and supporting text.",
  props: z.object({ children: z.array(z.union([Header.ref, Text.ref, Metric.ref])) }),
  component: ({ props, renderNode }) => (
    <article className="preview-card">{renderNode(props.children)}</article>
  ),
});

// The CLI generates the spec from this exact library. The browser renders it too.
export const library = createLibrary({ root: "Card", components: [Card, Header, Text, Metric] });
