import { createOpenAI } from "@ai-sdk/openai";

// OpenUI Cloud by default; set OPENAI_API_KEY (and optionally OPENAI_BASE_URL) to use another provider
const useOpenUICloud = !process.env["OPENAI_API_KEY"] && !!process.env["THESYS_API_KEY"];

const provider = createOpenAI(
  useOpenUICloud
    ? { baseURL: "https://api.thesys.dev/v1/embed", apiKey: process.env["THESYS_API_KEY"] }
    : { baseURL: process.env["OPENAI_BASE_URL"], apiKey: process.env["OPENAI_API_KEY"] },
);

export const model = provider.chat(
  process.env["MODEL"] ?? (useOpenUICloud ? "google/gemini-3.6-flash-free" : "gpt-4.1-mini"),
);
