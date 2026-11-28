import { describe, expect, it } from "vitest";
import { fakeFetch, json } from "./__tests__/fake-fetch";
import type { CreateAutofixParams } from "./autofix/types";
import { OpenUIClient } from "./client";
import { createAutofix as createChatAutofix } from "./openai";
import { createAutofix as createAiAutofix } from "./vercel";

const library = {
  root: "Card",
  components: { Card: { signature: "Card(title: string)", description: "A card" } },
  schema: {
    type: "object",
    properties: { Card: { $ref: "#/$defs/Card" } },
    $defs: { Card: { type: "object", properties: { title: { type: "string" } } } },
  },
} as unknown as CreateAutofixParams["library"];
const invalid = 'root = Card("a")\nx = Card("b")';
const fixed = {
  choices: [{ message: { content: 'root = Card("fixed")' } }],
  fix_summary: { status: "fixed", fixed_errors: [], unfixed_errors: [] },
};

describe("OpenUIClient", () => {
  it.each(["", " "])("rejects the appId %j", (appId) => {
    expect(() => new OpenUIClient({ appId })).toThrow("appId must be a non-empty string");
  });

  it.each([
    ["chat", (openui: OpenUIClient) => openui.chat.createAutofix({ library })],
    ["ai", (openui: OpenUIClient) => openui.ai.createAutofix({ library })],
  ])("creates %s Autofix on the client's key, baseUrl and fetch", async (_, create) => {
    const { fetch, requests } = fakeFetch(() => json(fixed));
    const autofix = create(new OpenUIClient({ apiKey: "k", baseUrl: "https://cloud.test", fetch }));
    expect(Object.keys(autofix).sort()).toEqual(["fix", "stream"]);
    expect(await autofix.fix({ generation: invalid })).toMatchObject({ status: "fixed" });
    expect(requests[0]!.url.href).toBe("https://cloud.test/v1/autofix");
    expect(requests[0]!.headers["Authorization"]).toBe("Bearer k");
  });
});

describe("deprecated createAutofix", () => {
  it.each([
    ["/openai", "completions", createChatAutofix],
    ["/vercel", "ai", createAiAutofix],
  ])("from %s still returns { %s } on its own key and origin", async (_, key, create) => {
    const { fetch, requests } = fakeFetch(() => json(fixed));
    const autofix = create({ apiKey: "k2", library, apiBaseUrl: "https://other.test/", fetch });
    expect(Object.keys(autofix)).toEqual([key]);
    const [helpers] = Object.values(autofix) as [ReturnType<OpenUIClient["chat"]["createAutofix"]>];
    expect(await helpers.fix({ generation: invalid })).toMatchObject({ status: "fixed" });
    expect(requests[0]!.url.href).toBe("https://other.test/v1/autofix");
    expect(requests[0]!.headers["Authorization"]).toBe("Bearer k2");
  });
});
