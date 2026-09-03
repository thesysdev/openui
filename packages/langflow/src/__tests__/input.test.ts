import type { Message } from "@ag-ui/core";
import { describe, expect, it } from "vitest";

import { toLangflowInput } from "../input";

describe("toLangflowInput", () => {
  it("sends only the newest user turn because the thread maps to Langflow memory", () => {
    const input = toLangflowInput([
      userMessage("user-1", "Compare Python and Rust adoption."),
      assistantMessage("assistant-1", "root = Card([])"),
      userMessage("user-2", "Now show the five-year trend."),
    ]);

    expect(input).toBe("Now show the five-year trend.");
  });

  it("keeps a clicked follow-up and its action context", () => {
    const input = toLangflowInput([
      userMessage(
        "user-1",
        ']]\u003eopenui:content\nShow the five-year trend\n]]\u003eopenui:context\n["User clicked: Show the five-year trend"]',
      ),
    ]);

    expect(input).toBe("Show the five-year trend\nUser clicked: Show the five-year trend");
  });

  it("passes edited form values and action context to Langflow", () => {
    const input = toLangflowInput([
      userMessage(
        "user-1",
        ']]\u003eopenui:content\nSubmit project\n]]\u003eopenui:context\n["User clicked: Submit project",{"name":"Ada Lovelace","email":"ada@example.com","teamSize":"11-25"}]',
      ),
    ]);

    expect(input).toContain("Submit project");
    expect(input).toContain("Ada Lovelace");
    expect(input).toContain("ada@example.com");
    expect(input).toContain('"teamSize":"11-25"');
  });

  it("reads text blocks from multimodal user content", () => {
    const input = toLangflowInput([
      {
        id: "user-1",
        role: "user",
        content: [
          { type: "text", text: "Describe this file" },
          { type: "binary", mimeType: "image/png", data: "aGVsbG8=" },
        ],
      },
    ]);

    expect(input).toBe("Describe this file");
  });

  it("rejects a request without a non-empty user turn", () => {
    expect(() => toLangflowInput([assistantMessage("assistant-1", "Hello")])).toThrow(
      "Expected at least one non-empty user message",
    );
  });
});

function userMessage(id: string, content: string): Message {
  return { id, role: "user", content };
}

function assistantMessage(id: string, content: string): Message {
  return { id, role: "assistant", content };
}
