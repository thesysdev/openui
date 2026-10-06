import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { z } from "zod/v4";
import { CartLink } from "./components/cart";
import { HtmlArtifact } from "./components/html-artifact";

// The chat library generates the server's specification and renders in the client. It gains two
// components: CartLink, which marks a cart change and opens the cart from the header, and
// HtmlArtifact, which opens printable pages such as gift cards in the side panel.

// Card lists the components it can hold, so redefine it with the same props, description, and
// renderer, plus the two new components. Without this, the model is told a Card can't contain them.
const chatCard = openuiChatLibrary.components.Card;
const chatChildren = chatCard.props.shape.children as z.ZodArray<z.ZodUnion>;
const Card = defineComponent({
  name: "Card",
  description: chatCard.description,
  props: chatCard.props.extend({
    children: z.array(z.union([...chatChildren.element.options, CartLink.ref, HtmlArtifact.ref])),
  }),
  component: chatCard.component,
});

export const library = createLibrary({
  root: openuiChatLibrary.root,
  componentGroups: [
    ...(openuiChatLibrary.componentGroups ?? []),
    {
      name: "Cart and printable pages",
      components: ["CartLink", "HtmlArtifact"],
      notes: [
        "- CartLink opens the cart in the header, which loads the cart itself; never repeat its items or a checkout button in the answer.",
        "- HtmlArtifact shows a button in the answer and opens the page in the side panel.",
      ],
    },
  ],
  components: Object.values({ ...openuiChatLibrary.components, Card, CartLink, HtmlArtifact }),
});
