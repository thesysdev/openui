import { describe, expect, it } from "vitest";
import { buildMessage, parseMessage } from "../message";

describe("message protocol", () => {
  it("round trips content, context, attributes, and end", () => {
    const input = {
      content: 'root = Card([title])\ntitle = TextContent("a ]]>openui:end")',
      context: [{ note: "rush" }],
      attributes: { library: "@acme/support@1.2.0", note: "a b!" },
      end: true,
    };
    const raw = buildMessage(input);
    expect(raw.split("\n")[0]).toBe(
      "]]>openui:content?" + new URLSearchParams(input.attributes).toString(),
    );
    expect(parseMessage(raw)).toEqual(input);
    expect(parseMessage(`${raw}\n`).content).toBe(input.content);
  });

  it("keeps plain text byte for byte", () => {
    const plain = "Hi\r\n```openui-lang\nroot = A()\n```\n";
    expect(parseMessage(plain)).toMatchObject({ content: plain, context: null, end: false });
  });

  it("uses the last content and keeps non-JSON context as text", () => {
    const raw =
      ']]>openui:content\nold\n]]>openui:context\n{}\n]]>openui:content?thesys=true\nnew\r\n]]>openui:context\n{"a":';
    expect(parseMessage(raw)).toEqual({
      content: "new",
      context: '{"a":',
      attributes: { thesys: "true" },
      end: false,
    });
  });

  it("holds back a marker line cut mid-stream", () => {
    const raw = "]]>openui:content\nroot = A()\n]]>open";
    expect(parseMessage(raw, { streaming: true }).content).toBe("root = A()");
    expect(parseMessage(raw).content).toBe("root = A()\n]]>open");
  });
});
