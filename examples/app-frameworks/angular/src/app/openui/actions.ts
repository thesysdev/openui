export function formMessage(
  title: string,
  fields: { name: string; label: string }[],
  values: Record<string, string>,
): string {
  return [title, ...fields.map((field) => `${field.label}: ${values[field.name] ?? ""}`)].join(
    "\n",
  );
}
