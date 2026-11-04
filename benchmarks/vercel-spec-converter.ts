export type JsonRenderElement = {
  type: string;
  props: Record<string, unknown>;
  children: string[];
};

export type JsonRenderSpec = {
  root: string;
  elements: Record<string, JsonRenderElement>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isElementNode(value: unknown): value is {
  type: "element";
  typeName: string;
  props?: Record<string, unknown>;
} {
  return isRecord(value) && value["type"] === "element" && typeof value["typeName"] === "string";
}

function hasElementNode(values: unknown[]) {
  return values.some(isElementNode);
}

export function astToVercelSpec(astRoot: unknown): JsonRenderSpec {
  const elements: Record<string, JsonRenderElement> = {};
  let idCounter = 1;

  function generateId(type: string) {
    return `${type.toLowerCase()}-${idCounter++}`;
  }

  function processNode(node: unknown): string | null {
    if (!isElementNode(node)) return null;

    const id = generateId(node.typeName);
    const props: Record<string, unknown> = {};
    const children: string[] = [];

    for (const [key, value] of Object.entries(node.props || {})) {
      if (key === "_args") {
        if (!Array.isArray(value)) continue;

        value.forEach((arg, index) => {
          if (Array.isArray(arg)) {
            if (hasElementNode(arg)) {
              for (const child of arg) {
                const childId = processNode(child);
                if (childId) children.push(childId);
              }
            } else {
              props[`arg${index}`] = arg;
            }
            return;
          }

          const childId = processNode(arg);
          if (childId) {
            children.push(childId);
          } else {
            props[`arg${index}`] = arg;
          }
        });
        continue;
      }

      if (Array.isArray(value)) {
        if (hasElementNode(value)) {
          for (const child of value) {
            const childId = processNode(child);
            if (childId) children.push(childId);
          }
        } else {
          props[key] = value;
        }
        continue;
      }

      const childId = processNode(value);
      if (childId) {
        children.push(childId);
      } else {
        props[key] = value;
      }
    }

    elements[id] = {
      type: node.typeName,
      props,
      children,
    };

    return id;
  }

  const root = processNode(astRoot);
  if (!root) {
    throw new Error("AST root did not produce a json-render spec.");
  }

  return { root, elements };
}
