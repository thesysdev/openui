import { describe, expect, it } from "vitest";
import { parseResponseBundle } from "./responseBundle";

const program = '```openui-lang\nroot = Text("Hello")\n```\n';
const script = { name: "sales_total", code: "async ({ tools }) => tools.get_sales({})" };

function scriptsSection(values: unknown, count: unknown = 1) {
  return `]]>openui:scripts ${JSON.stringify({ count })}\n${JSON.stringify(values)}\n`;
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
      const response = ` \n]]>openui:content?thesys=true&name=Sales+%26+Growth+%E2%82%AC\n${program}]]>openui:end\n`;

      expect(parseResponseBundle(response, false)).toEqual({
        program,
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
        program,
        metadata: {},
        complete: true,
        error: undefined,
      });
    });

    it("handles Windows line endings", () => {
      const response = `]]>openui:content?name=Sales\r\n${program.replaceAll("\n", "\r\n")}${scriptsSection([script]).replaceAll("\n", "\r\n")}]]>openui:end\r\n`;

      expect(parseResponseBundle(response, false)).toMatchObject({
        program: program.replaceAll("\n", "\r\n"),
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
        program: replacement,
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
        program,
        scripts: new Set(["sales_total", "save_sales"]),
        complete: true,
        error: undefined,
      });
    });

    it("accepts an explicitly empty scripts section", () => {
      const response = `]]>openui:content\n${program}${scriptsSection([], 0)}]]>openui:end`;

      expect(parseResponseBundle(response, false)).toMatchObject({
        scripts: new Set(),
        complete: true,
        error: undefined,
      });
    });

    it.each(["", "]]>openui:end"])("accepts a legacy script bundle with end marker %j", (end) => {
      const response = `${program}${scriptsSection([script])}${end}`;

      expect(parseResponseBundle(response, false)).toMatchObject({
        program,
        isBundle: true,
        scripts: new Set(["sales_total"]),
        complete: true,
        error: undefined,
      });
    });

    it.each([
      ["non-array payload", {}, 1],
      ["null payload", null, 1],
      ["mismatched count", [script], 2],
      ["string count", [script], "1"],
      ["fractional count", [script], 1.5],
      ["negative count", [], -1],
      ["null entry", [null], 1],
      ["missing name", [{ code: "async () => null" }], 1],
      ["empty name", [{ ...script, name: "" }], 1],
      ["non-string name", [{ ...script, name: 42 }], 1],
      ["missing code", [{ name: "sales_total" }], 1],
      ["non-string code", [{ ...script, code: 42 }], 1],
      ["duplicate names", [script, script], 2],
    ])("rejects %s after streaming finishes", (_label, values, count) => {
      const response = `]]>openui:content\n${program}${scriptsSection(values, count)}]]>openui:end`;

      expect(parseResponseBundle(response, false)).toMatchObject({
        program,
        complete: false,
        error: "Invalid scripts bundle",
      });
      expect(parseResponseBundle(response, true)).toMatchObject({
        program,
        complete: false,
        error: undefined,
      });
    });

    it.each(["]]>openui:scripts {invalid}\n[]\n", ']]>openui:scripts {"count":1}\n[{"name":\n'])(
      "rejects malformed script JSON: %j",
      (section) => {
        const response = `]]>openui:content\n${program}${section}]]>openui:end`;

        expect(parseResponseBundle(response, false)).toMatchObject({
          program,
          complete: false,
          error: "Invalid scripts bundle",
        });
      },
    );
  });

  describe("streaming and incomplete responses", () => {
    it("keeps every partial chunk error-free and exposes the program progressively", () => {
      const header = "]]>openui:content?name=Sales\n";
      const response = `${header}${program}${scriptsSection([script])}]]>openui:end`;

      for (let length = 1; length <= response.length; length++) {
        const parsed = parseResponseBundle(response.slice(0, length), true);
        expect(parsed.error, `prefix length ${length}`).toBeUndefined();
        expect(parsed.complete, `prefix length ${length}`).toBe(length === response.length);
        expect(parsed.isBundle).toBe(true);
        const visibleLength = Math.max(0, Math.min(program.length, length - header.length));
        expect(parsed.program).toBe(program.slice(0, visibleLength));
      }
    });

    it.each(["]]", "]]>openui:content?name=Sales"])(
      "reports an unfinished header only when streaming stops: %j",
      (response) => {
        expect(parseResponseBundle(response, true)).toMatchObject({
          program: "",
          complete: false,
          error: undefined,
        });
        expect(parseResponseBundle(response, false)).toMatchObject({
          program: "",
          complete: false,
          error: "Incomplete response header",
        });
      },
    );

    it.each([
      "",
      "]]>openui:scripts",
      scriptsSection([script]),
      "]]>openui:unknown",
      "]]>openui:end\nunexpected content",
    ])("does not mark an unfinished or invalid envelope complete: %j", (tail) => {
      const response = `]]>openui:content\n${program}${tail}`;

      expect(parseResponseBundle(response, false)).toMatchObject({
        program,
        complete: false,
        error: "Incomplete response bundle",
      });
    });
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
        program: content,
        complete: true,
        error: undefined,
      });
    });

    it("does not treat marker text inside script code as the end of the payload", () => {
      const code = String.raw`async () => "Escaped quote: \"; ]]>openui:end; ]]>openui:scripts"`;
      const response = `]]>openui:content\n${program}${scriptsSection([{ ...script, code }])}]]>openui:end`;

      expect(parseResponseBundle(response, false)).toMatchObject({
        program,
        scripts: new Set(["sales_total"]),
        complete: true,
        error: undefined,
      });
    });
  });
});
