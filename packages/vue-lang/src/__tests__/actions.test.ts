import { action } from "@openuidev/lang-core";
import { mount } from "@vue/test-utils";
import { expect, it } from "vitest";
import { defineComponent as defineVueComponent, reactive } from "vue";
import { z } from "zod/v4";
import Renderer from "../Renderer.vue";
import { useOpenUI } from "../context.js";
import { createLibrary, defineComponent } from "../library.js";

it("delivers Action([...]) steps with any @ToAssistant context, for a reactive library", async () => {
  const Btn = defineComponent({
    name: "Btn",
    props: z.object({ label: z.string(), action: action().optional() }),
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
  const events: Array<{ type: string; params: unknown }> = [];
  const wrapper = mount(Renderer, {
    props: {
      response: `root = Btn("x", Action([@OpenUrl("u"), @ToAssistant("B", 0)]))`,
      library: reactive(createLibrary({ components: [Btn], root: "Btn" })),
      onAction: (e: any) => events.push(e),
    },
  });
  await wrapper.find("button").trigger("click");
  wrapper.unmount();
  expect(events.map((e) => [e.type, e.params])).toEqual([
    ["open_url", { url: "u" }],
    ["continue_conversation", { context: 0 }],
  ]);
});
