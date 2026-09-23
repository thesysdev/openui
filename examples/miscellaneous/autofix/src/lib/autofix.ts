import spec from "@/generated/spec.json";
import { createAutofix } from "@openuidev/server/openai";

export const autofix = createAutofix({
  apiKey: process.env.THESYS_API_KEY!,
  library: spec
});
