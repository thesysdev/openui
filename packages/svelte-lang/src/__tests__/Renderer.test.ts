import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import Renderer from "../lib/Renderer.svelte";
import { createLibrary, defineComponent } from "../lib/library.js";

// Dummy renderer — never actually renders DOM, used for parser/callback tests
const DummyComponent = (() => null) as any;

const TextContent = defineComponent({
  name: "TextContent",
  props: z.object({ text: z.string() }),
  description: "Displays text content",
  component: DummyComponent,
});

const library = createLibrary({
  components: [TextContent],
  root: "TextContent",
});

// openui-lang uses assignment syntax: `identifier = Component(args)`
const VALID_RESPONSE = 'root = TextContent("Hello world")';

// ─── Renderer ───────────────────────────────────────────────────────────────

describe("Renderer", () => {
  it("renders without errors when response is null", () => {
    const { container } = render(Renderer, {
      props: {
        response: null,
        library,
      },
    });

    // Should render an empty container (no crash)
    expect(container).toBeDefined();
  });

  it("renders without errors when response is empty string", () => {
    const { container } = render(Renderer, {
      props: {
        response: "",
        library,
      },
    });

    expect(container).toBeDefined();
  });

  it("calls onParseResult with null when response is null", async () => {
    const onParseResult = vi.fn();

    render(Renderer, {
      props: {
        response: null,
        library,
        onParseResult,
      },
    });

    // $effect runs asynchronously — flush microtasks
    await tick();

    expect(onParseResult).toHaveBeenCalledWith(null);
  });

  it("calls onParseResult with a ParseResult when given valid openui-lang", async () => {
    const onParseResult = vi.fn();

    render(Renderer, {
      props: {
        response: VALID_RESPONSE,
        library,
        onParseResult,
      },
    });

    await tick();

    expect(onParseResult).toHaveBeenCalled();
    const result = onParseResult.mock.calls[onParseResult.mock.calls.length - 1]![0];
    expect(result).not.toBeNull();
    expect(result.root).toBeDefined();
    expect(result.root).not.toBeNull();
  });

  it("parse result contains the correct component typeName", async () => {
    const onParseResult = vi.fn();

    render(Renderer, {
      props: {
        response: VALID_RESPONSE,
        library,
        onParseResult,
      },
    });

    await tick();

    const result = onParseResult.mock.calls[onParseResult.mock.calls.length - 1]![0];
    expect(result?.root?.typeName).toBe("TextContent");
  });

  it("defaults isStreaming to false", () => {
    // Should not throw when isStreaming is omitted
    const { container } = render(Renderer, {
      props: {
        response: null,
        library,
      },
    });
    expect(container).toBeDefined();
  });

  it("accepts isStreaming prop without errors", () => {
    const { container } = render(Renderer, {
      props: {
        response: null,
        library,
        isStreaming: true,
      },
    });
    expect(container).toBeDefined();
  });
});
