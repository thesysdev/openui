import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "../../library";
import type { ElementNode, OpenUIError } from "../../parser/types";
import { evaluateElementProps } from "../evaluate-tree";

const ListItem = defineComponent({
  name: "ListItem",
  props: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
  }),
  description: "List item",
  component: () => null,
});

const ListBlock = defineComponent({
  name: "ListBlock",
  props: z.object({
    items: z.array(ListItem.ref),
  }),
  description: "List block",
  component: () => null,
});

const library = createLibrary({
  components: [ListBlock, ListItem],
});

const evalContext = {
  getState: () => undefined,
  resolveRef: () => undefined,
};

describe("evaluateElementProps", () => {
  it("reports schema mismatches on static nested component props", () => {
    const errors: OpenUIError[] = [];
    const root: ElementNode = {
      type: "element",
      typeName: "ListBlock",
      props: {
        items: [
          {
            type: "element",
            typeName: "ListItem",
            statementId: "item1",
            props: {
              title: { title: "Inbox", subtitle: "12 unread" },
            },
            partial: false,
            hasDynamicProps: false,
          },
        ],
      },
      partial: false,
      hasDynamicProps: false,
    };

    const evaluated = evaluateElementProps(root, {
      ctx: evalContext,
      library,
      store: null,
      errors,
    });

    expect(evaluated).toEqual(root);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      source: "runtime",
      code: "runtime-error",
      component: "ListItem",
      statementId: "item1",
      path: "/title",
    });
    expect(errors[0]?.message).toContain('Prop "title" on ListItem does not match its schema');
  });
});
