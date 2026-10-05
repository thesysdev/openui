import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { z } from "zod/v4";
import { CartPanel } from "./components/cart-panel";
import { HtmlArtifact } from "./components/html-artifact";

// The chat library generates the server's specification and renders in the client. It gains two
// components that open Agent Interface's side panel: CartPanel for the cart, and HtmlArtifact
// for printable pages such as gift cards.

// Card lists the components it can hold, so redefine it with the same props, description, and
// renderer, plus the two new components. Without this, the model is told a Card can't contain them.
const chatCard = openuiChatLibrary.components.Card;
const chatChildren = chatCard.props.shape.children as z.ZodArray<z.ZodUnion>;
const Card = defineComponent({
  name: "Card",
  description: chatCard.description,
  props: chatCard.props.extend({
    children: z.array(z.union([...chatChildren.element.options, CartPanel.ref, HtmlArtifact.ref])),
  }),
  component: chatCard.component,
});

export const library = createLibrary({
  root: openuiChatLibrary.root,
  componentGroups: [
    ...(openuiChatLibrary.componentGroups ?? []),
    {
      name: "Side panels",
      components: ["CartPanel", "HtmlArtifact"],
      notes: [
        "- CartPanel and HtmlArtifact show a button in the answer and open the side panel beside the chat.",
        "- CartPanel loads the cart itself; never repeat its items or checkout button in the answer.",
      ],
    },
  ],
  components: Object.values({ ...openuiChatLibrary.components, Card, CartPanel, HtmlArtifact }),
});
