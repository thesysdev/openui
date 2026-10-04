import OpenAI from "openai";
import { embeddingModel } from "./documents";

// OpenUI Gateway does not serve embeddings, so passages and questions are embedded with
// OpenAI's embeddings API. Its vectors are normalized, so a dot product is cosine similarity.
export async function embed(texts: string[], signal?: AbortSignal): Promise<Float32Array[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Configure OPENAI_API_KEY in .env.local to embed documents.");
  const client = new OpenAI({ apiKey });
  const response = await client.embeddings.create(
    { model: embeddingModel, input: texts },
    { signal },
  );
  return response.data.map((item) => Float32Array.from(item.embedding));
}

export function similarity(a: Float32Array, b: Float32Array) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}
