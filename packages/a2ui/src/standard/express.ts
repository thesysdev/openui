import { BASIC_CATALOG_FUNCTIONS } from "./catalog";

/**
 * A2UI Express and OpenUI Lang are close enough that one becomes the other with
 * a few text rewrites, applied outside string literals (see a2ui-project/a2ui#3214):
 *
 *   A2UI Express                        OpenUI Lang
 *   <a2ui> … </a2ui>                    (no wrapper)
 *   $/user/name, $/items/0              $user.name, $items[0]
 *   _  (skipped argument)               null
 *   Event("save", {id: $/id})           @save({id: $id})
 *   formatDate($/d, "MMM d")            @formatDate($d, "MMM d")
 *   $/form/email = ""                   $form = {email: ""}
 *
 * Everything else, including component calls, lists and objects, is written
 * the same way in both. Express template lists (`_template`), relative paths
 * inside templates and `?checks` are not translated.
 */

export interface ExpressRewriteOptions {
  /** Catalog function names. Defaults to the Basic Catalog's. */
  functions?: Iterable<string>;
}

/** Matches a double- or single-quoted string literal. */
const STRING = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/;

/** Applies `rewrite` to the code between string literals, leaving the strings as they are. */
function outsideStrings(source: string, rewrite: (code: string) => string): string {
  return source
    .split(STRING)
    .map((part, i) => (i % 2 ? part : rewrite(part)))
    .join("");
}

/** Removes Express's <a2ui> tags, a Markdown code fence and comment lines. */
function stripWrapper(source: string): string {
  return source
    .replace(/<\/?a2ui>/g, "")
    .replace(/^\s*```[\w-]*\s*$/gm, "")
    .split("\n")
    .filter((line) => !/^\s*(#|\/\/|--)/.test(line))
    .join("\n");
}

function functionNames(options: ExpressRewriteOptions): Set<string> {
  return new Set(options.functions ?? Object.keys(BASIC_CATALOG_FUNCTIONS));
}

/** `$/user/name` -> `$user.name`, `$/items/0` -> `$items[0]` */
function expressPath(path: string): string {
  const [head, ...rest] = path.split("/");
  return "$" + head + rest.map((s) => (/^\d+$/.test(s) ? `[${s}]` : `.${s}`)).join("");
}

/** Translates A2UI Express into OpenUI Lang. */
export function expressToOpenUI(express: string, options: ExpressRewriteOptions = {}): string {
  const names = [...functionNames(options)];
  const functionCall = new RegExp(`(?<![@\\w.])(${names.join("|")})(?=\\s*\\()`, "g");
  const code = (part: string) =>
    part
      .replace(functionCall, "@$1")
      .replace(/\$\/([\w/]+)/g, (_, path: string) => expressPath(path))
      .replace(/([(,[]\s*)_(?=\s*[,)\]])/g, "$1null");

  // Event("name", …) becomes @name(…). The name is a string, so this runs on the whole text.
  const source = stripWrapper(express).replace(
    /Event\(\s*"([A-Za-z_]\w*)"\s*,?\s*/g,
    (_, name: string) => `@${name}(`,
  );

  // Express declares data per path ($/form/email = ""). OpenUI Lang declares a
  // top-level $variable, so nested declarations are merged into one object,
  // written where the first of them appeared.
  type Tree = { [key: string]: Tree | string };
  const trees = new Map<string, Tree>();
  const lines: (string | { tree: string })[] = [];
  for (const line of source.split("\n")) {
    const decl = line.match(/^\s*\$\/([\w/]+)\s*=\s*(.*)$/);
    const segments = decl?.[1]!.split("/");
    if (!decl || !segments || segments.length < 2) {
      lines.push(outsideStrings(line, code));
      continue;
    }
    const [head, ...rest] = segments as [string, ...string[]];
    if (!trees.has(head)) {
      trees.set(head, {});
      lines.push({ tree: head });
    }
    let node = trees.get(head)!;
    for (const key of rest.slice(0, -1)) {
      if (typeof node[key] !== "object") node[key] = {};
      node = node[key] as Tree;
    }
    node[rest.at(-1)!] = outsideStrings(decl[2]!, code);
  }

  const print = (tree: Tree): string =>
    `{${Object.entries(tree)
      .map(([k, v]) => `${k}: ${typeof v === "string" ? v : print(v)}`)
      .join(", ")}}`;
  return lines
    .map((line) =>
      typeof line === "string" ? line : `$${line.tree} = ${print(trees.get(line.tree)!)}`,
    )
    .join("\n")
    .trim();
}

/** Translates OpenUI Lang, limited to what A2UI can express, into A2UI Express. */
export function openUIToExpress(openui: string, options: ExpressRewriteOptions = {}): string {
  const names = functionNames(options);
  return outsideStrings(stripWrapper(openui), (code) =>
    code
      .replace(/@([A-Za-z_]\w*)\(\s*(\))?/g, (_, name: string, close?: string) =>
        names.has(name)
          ? `${name}(${close ?? ""}`
          : close
            ? `Event("${name}")`
            : `Event("${name}", `,
      )
      .replace(
        /\$([A-Za-z_]\w*(?:\.[A-Za-z_]\w*|\[\d+\])*)/g,
        (_, path: string) => "$/" + path.replace(/\[(\d+)\]/g, ".$1").replaceAll(".", "/"),
      )
      .replace(/([(,[]\s*)null(?=\s*[,)\]])/g, "$1_"),
  ).trim();
}
