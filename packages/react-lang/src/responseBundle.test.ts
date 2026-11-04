import { describe, expect, it } from "vitest";
import { parseResponseBundle } from "./responseBundle";

const program = '```openui-lang\nroot = Text("Hello")\n```\n';
// The newline before a marker line is not part of the program (spec 7.2).
const body = program.trimEnd();
const script = { name: "sales_total", code: "async ({ tools }) => tools.get_sales({})" };

function scriptsSection(values: { name: string; code: string }[]) {
  return values.map(({ name, code }) => `\`\`\`openui-js ${name}\n${code}\n\`\`\`\n`).join("");
}

// While streaming, a last line that may still open a fence is held back.
function visible(text: string) {
  const at = text.lastIndexOf("\n") + 1;
  return /^(`{1,2}|`{3,}(o(p(e(n(u(i(-(j(s ?)?)?)?)?)?)?)?)?)?)$/.test(text.slice(at))
    ? text.slice(0, at)
    : text;
}

describe("parseResponseBundle", () => {
  describe("plain programs", () => {
    it.each([null, "", "  \n", 'root = Text("Hello")', program])(
      "preserves an unframed response: %j",
      (response) => {
        for (const streaming of [false, true]) {
          expect(parseResponseBundle(response, streaming)).toEqual({
            program: response ?? "",
            metadata: {},
            scripts: new Set(),
            complete: true,
            isBundle: false,
            error: undefined,
          });
        }
      },
    );
  });

  describe("content and metadata", () => {
    it("decodes the optional name and separates the program from its envelope", () => {
      const response = ` \n]]>openui:content?v=2&name=Sales+%26+Growth+%E2%82%AC\n${program}]]>openui:end\n`;

      expect(parseResponseBundle(response, false)).toEqual({
        program: body,
        metadata: { name: "Sales & Growth €" },
        scripts: new Set(),
        complete: true,
        isBundle: true,
        error: undefined,
      });
    });

    it("accepts a bundle without metadata or scripts", () => {
      const response = `]]>openui:content\n${program}]]>openui:end`;

      expect(parseResponseBundle(response, false)).toMatchObject({
        program: body,
        metadata: {},
        complete: true,
        error: undefined,
      });
    });

    it("handles Windows line endings", () => {
      const response = `]]>openui:content?name=Sales\r\n${program.replaceAll("\n", "\r\n")}${scriptsSection([script]).replaceAll("\n", "\r\n")}]]>openui:end\r\n`;

      expect(parseResponseBundle(response, false)).toMatchObject({
        program: body.replaceAll("\n", "\r\n"),
        metadata: { name: "Sales" },
        scripts: new Set(["sales_total"]),
        complete: true,
        error: undefined,
      });
    });

    it("uses the latest content section without retaining old scripts or metadata", () => {
      const previous = `]]>openui:content?name=Previous\n${program}${scriptsSection([script])}]]>openui:end\n`;
      const replacement = 'root = Text("Updated")\n';
      const response = `${previous}]]>openui:content\n${replacement}]]>openui:end`;

      expect(parseResponseBundle(response, false)).toEqual({
        program: replacement.trimEnd(),
        metadata: {},
        scripts: new Set(),
        complete: true,
        isBundle: true,
        error: undefined,
      });
    });
  });

  describe("scripts", () => {
    it("extracts script names without including script definitions in the program", () => {
      const values = [script, { name: "save_sales", code: "async () => null" }];
      const response = `]]>openui:content\n${program}${scriptsSection(values, 2)}]]>openui:end`;

      expect(parseResponseBundle(response, false)).toMatchObject({
        program: body,
        scripts: new Set(["sales_total", "save_sales"]),
        complete: true,
        error: undefined,
      });
    });

    it.each(["", "]]>openui:end"])(
      "accepts fenced scripts without a content line, end marker %j",
      (end) => {
        const response = `${program}${scriptsSection([script])}${end}`;

        expect(parseResponseBundle(response, false)).toMatchObject({
          program: body,
          isBundle: true,
          scripts: new Set(["sales_total"]),
          complete: true,
          error: undefined,
        });
      },
    );

    it.each([
      ["a script without a name", "```openui-js\nasync () => null\n```\n"],
      ["duplicate names", scriptsSection([script, script])],
      ["an unclosed fence", "```openui-js sales_total\nasync () => null\n"],
    ])("rejects %s after streaming finishes", (_label, section) => {
      const response = `]]>openui:content\n${program}${section}]]>openui:end`;

      expect(parseResponseBundle(response, false)).toMatchObject({
        program: body,
        complete: false,
        error: "Invalid scripts bundle",
      });
    });
  });

  describe("streaming and incomplete responses", () => {
    it("keeps every partial chunk error-free and exposes the program progressively", () => {
      const header = "]]>openui:content?name=Sales\n";
      const response = `${header}${program}${scriptsSection([script])}]]>openui:end`;

      for (let length = 1; length <= response.length; length++) {
        const parsed = parseResponseBundle(response.slice(0, length), true);
        expect(parsed.error, `prefix length ${length}`).toBeUndefined();
        // A marker line, the end line included, is held back until its newline or the stream end.
        expect(parsed.isBundle, `prefix length ${length}`).toBe(length >= header.length);
        if (parsed.isBundle) expect(parsed.complete, `prefix length ${length}`).toBe(false);
        const visibleLength = Math.max(0, Math.min(program.length, length - header.length));
        expect(parsed.program.trimEnd()).toBe(visible(program.slice(0, visibleLength)).trimEnd());
      }
      expect(parseResponseBundle(response, false)).toMatchObject({
        complete: true,
        error: undefined,
      });
    });

    it.each(["]]", "]]>openui:content?name=Sales"])(
      "holds back an unfinished header while streaming: %j",
      (response) => {
        expect(parseResponseBundle(response, true)).toMatchObject({
          program: "",
          error: undefined,
        });
      },
    );

    it("reads a header without a body as an empty program", () => {
      expect(parseResponseBundle("]]>openui:content?name=Sales", false)).toMatchObject({
        program: "",
        metadata: { name: "Sales" },
        complete: true,
        error: undefined,
      });
    });

    it.each(["", scriptsSection([script]), "]]>openui:unknown"])(
      "renders a stored message without an end line: %j",
      (tail) => {
        const response = `]]>openui:content\n${program}${tail}`;

        expect(parseResponseBundle(response, false)).toMatchObject({
          program: tail ? body : program,
          complete: true,
          error: undefined,
        });
        // While streaming, the end line is what finishes a framed response.
        expect(parseResponseBundle(response, true)).toMatchObject({ complete: false });
      },
    );
  });

  describe("markers inside content", () => {
    it.each([
      'root = Text("]]>openui:scripts")\n',
      "root = Text(']]>openui:end')\n",
      String.raw`root = Text("An escaped quote: \" and marker: ]]>openui:end")` + "\n",
      String.raw`root = Text("A trailing backslash: \\")` + "\n",
      '// Ignore "]]>openui:scripts\nroot = Text("Hello")\n',
      '# Ignore \' ]]>openui:end\nroot = Text("Hello")\n',
    ])("preserves literal markers and comments: %j", (content) => {
      expect(parseResponseBundle(content, false)).toMatchObject({
        program: content,
        isBundle: false,
        error: undefined,
      });
      expect(
        parseResponseBundle(`]]>openui:content\n${content}]]>openui:end`, false),
      ).toMatchObject({
        program: content.trimEnd(),
        complete: true,
        error: undefined,
      });
    });

    it("does not treat marker text inside script code as the end of the payload", () => {
      const code = String.raw`async () => "Escaped quote: \"; ]]>openui:end; ]]>openui:scripts"`;
      const response = `]]>openui:content\n${program}${scriptsSection([{ ...script, code }])}]]>openui:end`;

      expect(parseResponseBundle(response, false)).toMatchObject({
        program: body,
        scripts: new Set(["sales_total"]),
        complete: true,
        error: undefined,
      });
    });
  });

  it("reads a content line that starts mid-line after a cut-off attempt", () => {
    const header = "]]>openui:content?v=2";
    const response = `${header}\nroot = Text("Broken${header}\n${program}${scriptsSection([script])}]]>openui:end`;
    expect(parseResponseBundle(response, false)).toMatchObject({
      program: body,
      scripts: new Set(["sales_total"]),
      complete: true,
    });
  });
});
