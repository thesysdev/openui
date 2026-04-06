import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Renderer } from "../Renderer";
import { createLibrary, defineComponent } from "../library";

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

const VALID_RESPONSE = 'root = TextContent("Hello world")';

describe("Renderer", () => {
  it("renders without errors when response is null", () => {
    const { container } = render(() => <Renderer response={null} library={library} />);
    expect(container).toBeDefined();
  });

  it("renders without errors when response is empty string", () => {
    const { container } = render(() => <Renderer response="" library={library} />);
    expect(container).toBeDefined();
  });

  it("calls onParseResult with null when response is null", async () => {
    const onParseResult = vi.fn();

    render(() => <Renderer response={null} library={library} onParseResult={onParseResult} />);

    await Promise.resolve();
    expect(onParseResult).toHaveBeenCalledWith(null);
  });

  it("calls onParseResult with a ParseResult when given valid openui-lang", async () => {
    const onParseResult = vi.fn();

    render(() => (
      <Renderer response={VALID_RESPONSE} library={library} onParseResult={onParseResult} />
    ));

    await Promise.resolve();

    expect(onParseResult).toHaveBeenCalled();
    const result = onParseResult.mock.calls[onParseResult.mock.calls.length - 1]![0];
    expect(result).not.toBeNull();
    expect(result.root).toBeDefined();
    expect(result.root).not.toBeNull();
  });

  it("parse result contains the correct component typeName", async () => {
    const onParseResult = vi.fn();

    render(() => (
      <Renderer response={VALID_RESPONSE} library={library} onParseResult={onParseResult} />
    ));

    await Promise.resolve();

    const result = onParseResult.mock.calls[onParseResult.mock.calls.length - 1]![0];
    expect(result?.root?.typeName).toBe("TextContent");
  });

  it("defaults isStreaming to false", () => {
    const { container } = render(() => <Renderer response={null} library={library} />);
    expect(container).toBeDefined();
  });

  it("accepts isStreaming prop without errors", () => {
    const { container } = render(() => <Renderer response={null} library={library} isStreaming />);
    expect(container).toBeDefined();
  });
});
