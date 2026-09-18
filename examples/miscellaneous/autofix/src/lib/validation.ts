import { createParser } from "@openuidev/lang-core";
import spec from "../generated/spec.json";

export type Diagnostic = { code: string; message: string; statementId?: string };
const parser = createParser(spec.schema, spec.root);

/** Validate completed bare or fenced output against the same spec sent to Autofix. */
export function findErrors(generation: string): Diagnostic[] {
  const { root, meta } = parser.parse(generation);
  return [
    ...meta.errors,
    ...meta.unresolved.map((name) => ({
      code: "unresolved",
      statementId: name,
      message: `"${name}" is referenced but never defined.`,
    })),
    ...meta.orphaned.map((name) => ({
      code: "orphaned",
      statementId: name,
      message: `"${name}" is defined but never used.`,
    })),
    ...(meta.incomplete
      ? [{ code: "incomplete", message: "The generation ends mid-statement." }]
      : []),
    ...(root === null ? [{ code: "missing-root", message: "No renderable root component." }] : []),
  ];
}
