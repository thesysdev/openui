import { mount } from "@vue/test-utils";
import { expect, it } from "vitest";
import { defineComponent as defineVueComponent } from "vue";
import { z } from "zod/v4";
import Renderer from "../Renderer.vue";
import { useOpenUI } from "../context.js";
import { createLibrary, defineComponent } from "../library.js";

const Btn = defineComponent({
  name: "Btn",
  props: z.object({ label: z.string(), action: z.any().optional() }),
  description: "",
  component: defineVueComponent({
    props: ["props"],
    setup(p) {
      const ctx = useOpenUI();
      return { click: () => ctx.triggerAction(p.props.label, undefined, p.props.action) };
    },
    template: `<button @click="click">{{ props.label }}</button>`,
  }) as any,
});
const library = createLibrary({ components: [Btn], root: "Btn" });

it("forwards any @ToAssistant context, including falsy ones, in params.context", async () => {
  const params: unknown[] = [];
  for (const args of [`"A", { ticket: "T-42" }`, `"B", 0`, `"C", ""`, `"D"`]) {
    const wrapper = mount(Renderer, {
      props: {
        response: `root = Btn("x", Action([@ToAssistant(${args})]))`,
        library,
        onAction: (e: { params: unknown }) => params.push(e.params),
      },
    });
    await wrapper.find("button").trigger("click");
    wrapper.unmount();
  }
  expect(params).toEqual([{ context: { ticket: "T-42" } }, { context: 0 }, { context: "" }, {}]);
});
