import { describe, expect, it } from "vitest";
import { generateSystemPrompt, type CloudPromptOptions, type LibrarySpec } from "../../index";

const CONFIG_MARKER = "]]>openui:config\n";

const CLOUD_CONFIG_KEYS = [
  "libraryVersion",
  "customComponents",
  "customActions",
  "openrouterProvider",
  "chatLibrary",
  "systemPromptOptions",
];

function parseBlock(emitted: string): Record<string, unknown> {
  expect(emitted.startsWith(CONFIG_MARKER)).toBe(true);
  const body = emitted.slice(CONFIG_MARKER.length);
  const firstLine = body.split("\n", 1)[0];
  return JSON.parse(firstLine);
}

const library = {
  root: "Card",
  schema: {
    $defs: {
      Card: {
        properties: {
          children: {
            type: "array",
            items: { anyOf: [{ $ref: "#/$defs/TextContent" }] },
          },
          title: { type: "string" },
        },
        required: ["children"],
        description: "Top-level container.",
      },
      TextContent: {
        properties: { text: { type: "string" } },
        required: ["text"],
      },
    },
  },
  componentGroups: [
    {
      name: "Content",
      components: ["TextContent"],
    },
  ],
} as LibrarySpec;

describe("generateSystemPrompt — self-hosted", () => {
  const spec: LibrarySpec = {
    root: "Card",
    components: {
      Card: { signature: "Card(children: Component[])", description: "Root" },
    },
  };

  it("renders a local prompt from a library spec", () => {
    const prompt = generateSystemPrompt({ library: spec });
    expect(prompt).toContain("openui-lang");
    expect(prompt).toContain("Card(children: Component[])");
    expect(prompt.startsWith(CONFIG_MARKER)).toBe(false);
  });
});

describe("generateSystemPrompt({ cloud: true }) — sentinel", () => {
  it("starts with the byte-exact marker", () => {
    const out = generateSystemPrompt({ cloud: true });
    expect(out.slice(0, CONFIG_MARKER.length)).toBe(CONFIG_MARKER);
  });

  it("no library → JSON with only libraryVersion", () => {
    const config = parseBlock(generateSystemPrompt({ cloud: true }));
    expect(Object.keys(config)).toEqual(["libraryVersion"]);
    expect(config.libraryVersion).toBe("0.1.0");
  });

  it("emitted keys are a subset of Cloud config keys", () => {
    const config = parseBlock(generateSystemPrompt({ cloud: true, instructions: "Be terse." }));
    for (const key of Object.keys(config)) {
      expect(CLOUD_CONFIG_KEYS).toContain(key);
    }
  });

  it("appends extra prose after the block", () => {
    const out = generateSystemPrompt({ cloud: true, instructions: "Be terse." });
    const [sentinelLine, jsonLine, ...rest] = out.split("\n");
    expect(sentinelLine).toBe("]]>openui:config");
    expect(() => JSON.parse(jsonLine)).not.toThrow();
    expect(rest.join("\n")).toBe("Be terse.");
  });

  it("no instructions → sentinel + JSON only", () => {
    expect(generateSystemPrompt({ cloud: true }).split("\n")).toHaveLength(2);
  });
});

describe("generateSystemPrompt({ cloud: true, library })", () => {
  it("emits the library under chatLibrary, dropping components", () => {
    const specJson = {
      ...library,
      components: {
        Card: { signature: "Card(children: (TextContent)[], title?: string)" },
      },
    };
    const config = parseBlock(generateSystemPrompt({ cloud: true, library: specJson }));
    expect((config.chatLibrary as Record<string, unknown>).components).toBeUndefined();
    expect(config.chatLibrary).toEqual(library);
    expect(Object.keys(config)).toEqual(["chatLibrary"]);
  });

  it("systemPromptOptions rides as a sibling key", () => {
    const config = parseBlock(
      generateSystemPrompt({
        cloud: true,
        library,
        promptOptions: { preamble: "You generate UI for Acme." },
      }),
    );
    expect(Object.keys(config)).toEqual(["chatLibrary", "systemPromptOptions"]);
    expect(config.systemPromptOptions).toEqual({ preamble: "You generate UI for Acme." });
  });

  it("strips Cloud-unsupported prompt flags from the wire", () => {
    const config = parseBlock(
      generateSystemPrompt({
        cloud: true,
        library,
        promptOptions: {
          preamble: "Acme.",
          editMode: true,
          tools: ["search"],
        } as CloudPromptOptions,
      }),
    );
    expect(config.systemPromptOptions).toEqual({ preamble: "Acme." });
  });

  it("promptOptions without a library throws", () => {
    expect(() =>
      generateSystemPrompt({
        cloud: true,
        promptOptions: { preamble: "Nope." },
      }),
    ).toThrowError(/promptOptions requires a library/);
  });

  it("invalid library throws with every issue", () => {
    const broken: LibrarySpec = {
      root: "Missing",
      components: {},
      schema: {
        $defs: {
          Card: {
            properties: { body: { $ref: "#/$defs/Nope" } },
            required: ["ghost"],
          },
        },
      },
    };
    expect(() => generateSystemPrompt({ cloud: true, library: broken })).toThrowError(
      /Invalid library/,
    );
    expect(() => generateSystemPrompt({ cloud: true, library: broken })).toThrowError(
      /Root component "Missing"/,
    );
    expect(() => generateSystemPrompt({ cloud: true, library: broken })).toThrowError(
      /Unresolvable \$ref "#\/\$defs\/Nope"/,
    );
    expect(() => generateSystemPrompt({ cloud: true, library: broken })).toThrowError(
      /required property "ghost"/,
    );
  });
});
