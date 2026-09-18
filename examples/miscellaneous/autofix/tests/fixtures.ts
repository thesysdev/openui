const context =
  "Show a September revenue summary. Revenue is $48,200, up 12% from August. Keep the title, revenue metric, and supporting note.";
const valid = `root = Card([title, revenue, note])
title = Header("September revenue")
revenue = Metric("Revenue", "$48,200", "+12% from August")
note = Text("A strong month, driven by returning customers.")`;

export const samples = [
  {
    id: "unknown",
    label: "Unknown component",
    description: "Heading is not in this library. Header is.",
    context,
    generation: valid.replace(
      'Header("September revenue")',
      'Heading("September revenue")',
    ),
    expectedError: "unknown-component",
  },
  {
    id: "missing",
    label: "Missing value",
    description:
      "Metric needs both a label and a value. The request context supplies the missing revenue.",
    context,
    generation: valid.replace(
      'Metric("Revenue", "$48,200", "+12% from August")',
      'Metric("Revenue")',
    ),
    expectedError: "missing-required",
  },
  {
    id: "reference",
    label: "Missing reference",
    description:
      "The card references note, but its statement was never generated.",
    context,
    generation: valid.split("\n").slice(0, -1).join("\n"),
    expectedError: "unresolved",
  },
  {
    id: "fenced",
    label: "Fenced output",
    description:
      "The API repairs the program and preserves its Markdown code fence.",
    context,
    generation:
      "```openui\n" +
      valid.replace(
        'Header("September revenue")',
        'Heading("September revenue")',
      ) +
      "\n```",
    expectedError: "unknown-component",
  },
  {
    id: "valid",
    label: "Already valid",
    description:
      "This program is valid. The API should return it unchanged with already_valid.",
    context,
    generation: valid,
    expectedError: null,
  },
] as const;
