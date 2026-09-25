/**
 * Structural validator for your own library.
 * Hand-rolled walker — reports every issue in one pass.
 */
import type { LibrarySpec } from "./prompt";

export interface ChatLibraryIssue {
  code:
    | "invalid-shape"
    | "root-not-found"
    | "unresolved-ref"
    | "unknown-group-component"
    | "invalid-required";
  message: string;
  /** e.g. "$defs/Card/properties/children/items" */
  path?: string;
}

const REF_PATTERN = /^#\/\$defs\/(.+)$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Recursively collect every `$ref` and check it resolves within `$defs`. */
function collectRefIssues(
  node: unknown,
  path: string,
  defNames: Set<string>,
  issues: ChatLibraryIssue[],
): void {
  if (Array.isArray(node)) {
    node.forEach((item, i) => collectRefIssues(item, `${path}/${i}`, defNames, issues));
    return;
  }
  if (!isPlainObject(node)) return;

  const ref = node["$ref"];
  if (typeof ref === "string") {
    const match = REF_PATTERN.exec(ref);
    if (!match || !defNames.has(match[1] as string)) {
      issues.push({
        code: "unresolved-ref",
        message: `Unresolvable $ref "${ref}" at ${path} — refs must be "#/$defs/<name>" pointing at a component in $defs.`,
        path,
      });
    }
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "$ref") continue;
    collectRefIssues(value, `${path}/${key}`, defNames, issues);
  }
}

/**
 * Structural validation of your own library.
 * Returns ALL issues found (empty array = valid).
 */
export function validateChatLibrary(library: LibrarySpec): ChatLibraryIssue[] {
  const issues: ChatLibraryIssue[] = [];

  if (!isPlainObject(library)) {
    return [
      {
        code: "invalid-shape",
        message: "chatLibrary must be an object.",
      },
    ];
  }

  const { root, schema, componentGroups } = library;

  if (root !== undefined && (typeof root !== "string" || root.length === 0)) {
    issues.push({
      code: "invalid-shape",
      message: "chatLibrary.root, when present, must be a non-empty string.",
      path: "root",
    });
  }

  if (!isPlainObject(schema)) {
    issues.push({
      code: "invalid-shape",
      message: "chatLibrary.schema must be an object with a $defs map of component schemas.",
      path: "schema",
    });
    return issues;
  }

  const defs = schema.$defs;
  if (!isPlainObject(defs) || Object.keys(defs).length === 0) {
    issues.push({
      code: "invalid-shape",
      message: "chatLibrary.schema.$defs must be a non-empty object keyed by component name.",
      path: "schema/$defs",
    });
    return issues;
  }

  const defNames = new Set(Object.keys(defs));

  if (typeof root === "string" && root.length > 0 && !defNames.has(root)) {
    issues.push({
      code: "root-not-found",
      message: `Root component "${root}" was not found in schema.$defs. Available components: ${[...defNames].join(", ")}.`,
      path: "root",
    });
  }

  for (const [name, def] of Object.entries(defs)) {
    const defPath = `$defs/${name}`;
    if (!isPlainObject(def)) {
      issues.push({
        code: "invalid-shape",
        message: `${defPath} must be an object component schema.`,
        path: defPath,
      });
      continue;
    }

    const properties = def["properties"];
    if (properties !== undefined && !isPlainObject(properties)) {
      issues.push({
        code: "invalid-shape",
        message: `${defPath}/properties must be an object.`,
        path: `${defPath}/properties`,
      });
    }

    const required = def["required"];
    if (required !== undefined) {
      if (!Array.isArray(required) || required.some((r) => typeof r !== "string")) {
        issues.push({
          code: "invalid-required",
          message: `${defPath}/required must be an array of property names.`,
          path: `${defPath}/required`,
        });
      } else {
        const propKeys = new Set(isPlainObject(properties) ? Object.keys(properties) : []);
        for (const r of required) {
          if (!propKeys.has(r)) {
            issues.push({
              code: "invalid-required",
              message: `${defPath} lists required property "${r}" that is not in properties.`,
              path: `${defPath}/required`,
            });
          }
        }
      }
    }

    collectRefIssues(properties, `${defPath}/properties`, defNames, issues);
  }

  for (const group of componentGroups ?? []) {
    if (
      !isPlainObject(group) ||
      typeof group.name !== "string" ||
      !Array.isArray(group.components)
    ) {
      issues.push({
        code: "invalid-shape",
        message:
          "Each componentGroups entry must be {name: string, components: string[], notes?: string[]}.",
        path: "componentGroups",
      });
      continue;
    }
    for (const comp of group.components) {
      if (typeof comp !== "string" || !defNames.has(comp)) {
        issues.push({
          code: "unknown-group-component",
          message: `Component group "${group.name}" references unknown component "${String(comp)}".`,
          path: "componentGroups",
        });
      }
    }
  }

  return issues;
}
