import { describe, expect, it } from "vitest";
import { createStreamParser, parse, stripFences } from "../parser";
import type { ParamMap } from "../types";

const schema: ParamMap = new Map([["Text", { params: [{ name: "text", required: true }] }]]);
const text = (input: string) =>
  (parse(input, schema).root?.props as { text?: unknown } | undefined)?.text ?? null;
const program = 'root = Text("hi")';
const CASES: [string, string][] = [
  ["a fence on its own line", "```openui\n" + program + "\n```"],
  ["a fence after prose on the same line", "Here is the UI: ```openui\n" + program + "\n```"],
  [
    "an inline ```openui``` mention before the real block",
    "Wrap it in ```openui``` like this:\n```openui\n" + program + "\n```",
  ],
  ["a one-line fence", "Sure. ```openui " + program + "```"],
  ["a one-line fence without a tag", "```" + program + "```"],
  ["a stray closing fence after the program", program + "\n```"],
  ["no fence at all", program],
  ["prose with inline code before an unfenced program", "Use `x` or ```y``` here\n" + program],
  [
    "a program followed by ```js script blocks",
    program +
      '\n\n```js sales_total\nasync ({ tools }) => {\n  const s = "```";\n  return 1;\n}\n```\n```javascript other\nasync () => 2\n```',
  ],
  ["a program fenced as js", "```js\n" + program + "\n```"],
  [
    "an opener with words after the tag",
    "```openui lang\n" + program + "\n```\nHope this helps (really).",
  ],
];

describe("code fences", () => {
  it.each([
    ["CRLF line endings", "Here:\r\n```openui\r\n" + program + "\r\n```"],
    ["a four-backtick fence", "````openui\n" + program + "\n````"],
  ])("extracts only the program from %s", (_, input) => {
    expect(stripFences(input).trim()).toBe(program);
  });
  it.each(CASES)("renders %s", (_, input) => {
    expect(text(input)).toBe("hi");
  });

  it("keeps ``` inside strings as text", () => {
    expect(text('root = Text("a ```b``` c")')).toBe("a ```b``` c");
  });

  it.each(CASES)("streams %s to the same result as the batch parse", (_, input) => {
    const stream = createStreamParser(schema);
    for (let i = 1; i < input.length; i++) stream.set(input.slice(0, i));
    expect(stream.set(input, true).root).toEqual(parse(input, schema).root);
  });
});
