type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isElementNode(
  value: unknown,
): value is { type: "element"; typeName: string; props?: unknown } {
  return isRecord(value) && value["type"] === "element" && typeof value["typeName"] === "string";
}

function convertValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(convertValue);
  }

  if (isElementNode(value)) {
    return {
      component: value.typeName,
      props: isRecord(value.props) ? (convertValue(value.props) as JsonRecord) : {},
    };
  }

  if (isRecord(value)) {
    const result: JsonRecord = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === "__typename") continue;
      result[key] = convertValue(nestedValue);
    }
    return result;
  }

  return value;
}

export function astToThesysC1Json(astRoot: unknown): string {
  const component = convertValue(astRoot);
  return JSON.stringify(
    {
      component,
      error: null,
    },
    null,
    2,
  );
}
