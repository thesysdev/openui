export function extractCodeOnly(response: string): string | null {
  const fenceRegex = /```[\w-]*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  while ((match = fenceRegex.exec(response)) !== null) {
    blocks.push(match[1].trim());
  }
  if (blocks.length > 0) return blocks.join("\n");

  const unclosedMatch = response.match(/```[\w-]*\n([\s\S]*)$/);
  if (unclosedMatch) return unclosedMatch[1].trim() || null;

  if (isPureCode(response)) return response;

  return null;
}

export function extractText(response: string): string {
  const withoutFences = response.replace(/```[\w-]*\n[\s\S]*?```/g, "").trim();
  const withoutUnclosed = withoutFences.replace(/```[\w-]*\n[\s\S]*$/g, "").trim();
  if (withoutUnclosed && isPureCode(withoutUnclosed)) return "";
  return withoutUnclosed;
}

export function responseHasCode(response: string): boolean {
  if (/```[\w-]*\n/.test(response)) return true;
  if (/^[a-zA-Z_$][\w$]*\s*=\s*/.test(response.trim())) return true;
  return false;
}

export function isPureCode(response: string): boolean {
  const trimmed = response.trim();
  if (/```/.test(trimmed)) return false;
  const lines = trimmed.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return false;
  const stmtPattern = /^[a-zA-Z_$][\w$]*\s*=/;
  const stmtCount = lines.filter((l) => stmtPattern.test(l.trim())).length;
  return stmtCount / lines.length > 0.7;
}
