import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { z } from "zod/v4";
import { HtmlArtifact } from "./components/html-artifact";

// The chat library generates the server's specification and renders in the client. It gains
// one component, HtmlArtifact, for printable pages such as gift cards.

// Card lists the components it can hold, so redefine it with the same props, description, and
// renderer, plus HtmlArtifact. Without this, the model is told a Card can't contain one.
const chatCard = openuiChatLibrary.components.Card;
const chatChildren = chatCard.props.shape.children as z.ZodArray<z.ZodUnion>;
const Card = defineComponent({
  name: "Card",
  description: chatCard.description,
  props: chatCard.props.extend({
    children: z.array(z.union([...chatChildren.element.options, HtmlArtifact.ref])),
  }),
  component: chatCard.component,
});

export const library = createLibrary({
  root: openuiChatLibrary.root,
  componentGroups: [
    ...(openuiChatLibrary.componentGroups ?? []),
    {
      name: "Printable pages",
      components: ["HtmlArtifact"],
      notes: [
        "- HtmlArtifact shows a button in the answer and opens the page in a side panel, where the shopper can print or download it.",
      ],
    },
  ],
  components: Object.values({ ...openuiChatLibrary.components, Card, HtmlArtifact }),
});
