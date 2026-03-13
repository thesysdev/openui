import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import Renderer from "../Renderer.svelte";
import { createLibrary, defineComponent } from "../library";
import Greeting from "./fixtures/Greeting.svelte";

describe("@openuidev/svelte-lang", () => {
  it("renders OpenUI Lang output and reports parse updates", () => {
    const onParseResult = vi.fn();
    const library = createLibrary({
      components: [
        defineComponent({
          name: "Greeting",
          description: "Simple greeting component",
          props: z.object({
            label: z.string(),
          }),
          component: Greeting,
        }),
      ],
      root: "Greeting",
    });

    const component = mount(Renderer, {
      target: document.body,
      props: {
        response: 'root = Greeting("Hello Svelte")',
        library,
        onParseResult,
      },
    });

    flushSync();

    expect(document.body.textContent).toContain("Hello Svelte");
    expect(onParseResult).toHaveBeenCalledWith(
      expect.objectContaining({
        root: expect.objectContaining({
          typeName: "Greeting",
        }),
      }),
    );

    unmount(component);
  });
});
