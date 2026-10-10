import { buildMessage, type BuildMessageInput } from "@openuidev/react-lang";
import { expect, it } from "vitest";
import { readMessage } from "../messages";

// Stored bytes as the old sentinelParser wrote them (wrapContent, wrapContentWithHeader, wrapContext)
const stored: {
  raw: string;
  content: string;
  context: unknown[] | null;
  write?: Partial<BuildMessageInput>;
}[] = [
  { raw: "Hello", content: "Hello", context: null },
  { raw: "]]>openui:content\nroot = A()", content: "root = A()", context: null, write: {} },
  {
    raw: "]]>openui:content?libraryVersion=0.5&thesys=true\nroot = A()\n]]>openui:end",
    content: "root = A()",
    context: null,
    write: { attributes: { libraryVersion: "0.5", thesys: "true" }, end: true },
  },
  {
    raw: ']]>openui:content?thesys=true\nroot = A()\n]]>openui:context\n[{"$a":{"value":1}}]',
    content: "root = A()",
    context: [{ $a: { value: 1 } }],
    write: { attributes: { thesys: "true" } },
  },
  {
    raw: ']]>openui:content\nSave\n]]>openui:context\n["User clicked: Save",{"$a":1}]',
    content: "Save",
    context: ["User clicked: Save", { $a: 1 }],
    write: {},
  },
  { raw: '\n]]>openui:context\n["User clicked: "]', content: "", context: ["User clicked: "] },
  {
    raw: '<content version="2">root = A()</content><context>[1]</context>',
    content: "root = A()",
    context: [1],
  },
];

it("reads and writes stored messages like the old sentinelParser", () => {
  for (const { raw, content, context, write } of stored) {
    expect(readMessage(raw)).toMatchObject({ content, context });
    if (write) expect(buildMessage({ content, context: context ?? undefined, ...write })).toBe(raw);
  }
  expect(readMessage("]]>openui:content\nroot = A()\n]]>openui:con", true).content).toBe(
    "root = A()",
  );
});

it("reads the sanitizer retry when its content line follows the failed attempt mid-line", () => {
  const header = "]]>openui:content?thesys=true";
  const raw = `${header}\nroot = A("Broken${header}\nroot = B()\n]]>openui:end`;
  expect(readMessage(raw).content).toBe("root = B()");
});
