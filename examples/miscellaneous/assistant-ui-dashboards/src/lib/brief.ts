// The handoff from the main agent to the dashboard builder. The main agent fills in
// these fields as create_dashboard's arguments; composeBrief turns them into the brief the
// builder reads as its request (OpenUI Cloud takes one prompt string). Three parts: context and
// intent, what to convey in priority order, filters and defaults. No chart types, no layout:
// the builder owns those.

export type BriefPoint = { convey: string; evidence: string; caveat?: string };
export type BriefFilter = {
  name: string;
  values: string;
  default: string;
  role?: "needed" | "optional";
};
export type Brief = {
  title: string;
  request: string;
  reader: string;
  intent: string;
  constraints?: string[];
  points: BriefPoint[];
  data_notes?: string;
  filters?: BriefFilter[];
};

/** The brief as the builder reads it. Tolerates missing fields, so the chat can show it while it streams in. */
export function composeBrief(brief: Partial<Brief>): string {
  const lines: string[] = ["# Context and intent"];
  if (brief.request) lines.push(`The user asked: "${brief.request.trim()}"`);
  if (brief.reader) lines.push(`Reader: ${brief.reader.trim()}`);
  if (brief.intent) lines.push(`What they want to understand or do: ${brief.intent.trim()}`);
  const constraints = (brief.constraints ?? []).filter(Boolean);
  if (constraints.length) {
    lines.push("Explicit constraints:");
    for (const constraint of constraints) lines.push(`- ${constraint.trim()}`);
  }

  lines.push("", "# What to convey, in priority order");
  (brief.points ?? []).forEach((point, index) => {
    if (!point?.convey) return;
    lines.push(`${index + 1}. ${point.convey.trim()}`);
    if (point.evidence) lines.push(`   Evidence: ${point.evidence.trim()}`);
    if (point.caveat) lines.push(`   Caveat: ${point.caveat.trim()}`);
  });
  if (brief.data_notes) lines.push("", `Data notes, for every point: ${brief.data_notes.trim()}`);

  lines.push("", "# Filters and defaults");
  const filters = (brief.filters ?? []).filter((filter) => filter?.name);
  if (filters.length) {
    for (const filter of filters) {
      const role = filter.role === "optional" ? "optional" : "needed";
      const end = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);
      lines.push(
        `- ${filter.name.trim()} (${role}): ${end((filter.values ?? "").trim())} Default: ${end((filter.default ?? "").trim())}`,
      );
    }
  } else {
    lines.push("None. Show the periods and segments named above without controls.");
  }
  return lines.join("\n");
}
