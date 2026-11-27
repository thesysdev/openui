import { describe, expect, it } from "vitest";
import { parseArtifactReference } from "../artifactReference";

const RESPONSE =
  "Sales is building.\n]]>openui:content?artifact_id=art_1&type=dashboard&name=Sales&version=v2";
const REMINDER = "Reply to the user in ONE short sentence.";
const MCP_RESULT = {
  content: [
    { type: "text", text: RESPONSE },
    { type: "text", text: REMINDER },
  ],
};
const REFERENCE = { id: "art_1", type: "dashboard", title: "Sales", version: "v2" };

describe("parseArtifactReference", () => {
  it.each([
    ["a string", RESPONSE],
    ["a string with the reply reminder after the reference line", `${RESPONSE}\n\n${REMINDER}`],
    ["an MCP tool result", MCP_RESULT],
    ["an MCP result's content array", MCP_RESULT.content],
    ["a JSON-encoded MCP result", JSON.stringify(MCP_RESULT)],
    ["a JSON-encoded string", JSON.stringify(RESPONSE)],
  ])("reads the reference from %s", (_, response) => {
    expect(parseArtifactReference(response)).toEqual(REFERENCE);
  });

  it.each([
    ["nothing", undefined],
    ["an empty string", ""],
    ["text without a reference", "The dashboard couldn't be started."],
    ["an MCP result with no text parts", { content: [{ type: "image", data: "", mimeType: "x" }] }],
    ["JSON that isn't a tool result", '{"ok":true}'],
  ])("returns null for %s", (_, response) => {
    expect(parseArtifactReference(response)).toBeNull();
  });
});
