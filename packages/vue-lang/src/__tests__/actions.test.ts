import { tagSchemaId } from "@openuidev/lang-core";
import { mount } from "@vue/test-utils";
import { expect, it } from "vitest";
import { defineComponent as defineVueComponent, reactive } from "vue";
import { z } from "zod/v4";
import Renderer from "../Renderer.vue";
import { useOpenUI } from "../context.js";
import { createLibrary, defineComponent } from "../library.js";

const actionExpression = z.any();
tagSchemaId(actionExpression, "ActionExpression");
const Btn = defineComponent({
  name: "Btn",
  props: z.object({ label: z.string(), action: actionExpression.optional() }),
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

it("delivers bare and list steps with any @ToAssistant context, also for a reactive library", async () => {
  const events: Array<{ type: string; params: unknown }> = [];
  for (const [lib, action] of [
    [library, `@ToAssistant("A", "")`],
    [reactive(library), `[@OpenUrl("u"), @ToAssistant("B", 0)]`],
  ] as const) {
    const wrapper = mount(Renderer, {
      props: {
        response: `root = Btn("x", ${action})`,
        library: lib,
        onAction: (e: any) => events.push(e),
      },
    });
    await wrapper.find("button").trigger("click");
    wrapper.unmount();
  }
  expect(events.map((e) => [e.type, e.params])).toEqual([
    ["continue_conversation", { context: "" }],
    ["open_url", { url: "u" }],
    ["continue_conversation", { context: 0 }],
  ]);
});
