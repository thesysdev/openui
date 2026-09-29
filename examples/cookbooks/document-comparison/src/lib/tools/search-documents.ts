import { statSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod/v4";
import { openDatabase, sources, type Document } from "../documents";
import { embed, similarity } from "../embeddings";

// The search_documents function tool: its JSON schema for Gateway, argument validation,
// semantic search over the prepared passages, and the executor the tool loop calls.

export function searchDocumentsTool(documents: Document[]) {
  return {
    type: "function" as const,
    function: {
      name: "search_documents",
      description:
        "Find passages about one comparison criterion in the documents. Returns the closest passages from each document with page numbers. Call it once per criterion.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The information to find, as a short description, such as 'total revenue for the fiscal year and growth from the prior year'.",
          },
          document_ids: {
            type: "array",
            items: { type: "string", enum: documents.map((document) => document.id) },
            description: "Documents to search. Empty for all documents.",
          },
          passages_per_document: {
            type: "integer",
            minimum: 1,
            maximum: 4,
            description:
              "Passages to return from each document. Use 2 unless more context is needed.",
          },
        },
        required: ["query", "document_ids", "passages_per_document"],
        additionalProperties: false,
      },
      strict: true,
    },
  };
}

// Validate arguments again on the server; the model's output is untrusted input.
const argsSchema = z
  .object({
    query: z.string().trim().min(3).max(300),
    document_ids: z.array(z.string()).max(10),
    passages_per_document: z.number().int().min(1).max(4),
  })
  .strict();

// Below this similarity, a document probably does not discuss the criterion.
const weakMatch = 0.3;

type Passage = { documentId: string; page: number; text: string; embedding: Float32Array };
let cache: { modified: number; documents: Document[]; passages: Passage[] } | undefined;

// Load every passage once and reload only after npm run prepare:documents changes the file.
function loadPassages() {
  const modified = statSync(resolve(process.cwd(), "data/documents.sqlite")).mtimeMs;
  if (cache?.modified === modified) return cache;
  const db = openDatabase();
  try {
    const documents = db
      .prepare("SELECT id, name, period, pages FROM documents ORDER BY rowid")
      .all() as Document[];
    const rows = db.prepare("SELECT document_id, page, text, embedding FROM chunks").all() as {
      document_id: string;
      page: number;
      text: string;
      embedding: Uint8Array;
    }[];
    const passages = rows.map((row) => ({
      documentId: row.document_id,
      page: row.page,
      text: row.text,
      embedding: new Float32Array(
        row.embedding.buffer.slice(
          row.embedding.byteOffset,
          row.embedding.byteOffset + row.embedding.byteLength,
        ),
      ),
    }));
    cache = { modified, documents, passages };
    return cache;
  } finally {
    db.close();
  }
}

export async function executeSearchDocuments(
  argsJson: string,
  { signal }: { signal?: AbortSignal } = {},
) {
  const args = argsSchema.parse(JSON.parse(argsJson));
  const { documents, passages } = loadPassages();
  const unknown = args.document_ids.filter(
    (id) => !documents.some((document) => document.id === id),
  );
  if (unknown.length) throw new RangeError(`Unknown documents: ${unknown.join(", ")}.`);
  const selected = args.document_ids.length
    ? documents.filter((document) => args.document_ids.includes(document.id))
    : documents;

  const [queryEmbedding] = await embed([args.query], signal);
  const results = selected.map((document) => {
    // PDF viewers open #page=N at that page. Your own PDFs in documents/ have no URL.
    const url = sources.find((source) => source.id === document.id)?.url;
    const matches = passages
      .filter((passage) => passage.documentId === document.id)
      .map((passage) => ({ ...passage, score: similarity(queryEmbedding, passage.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, args.passages_per_document);
    const bestScore = matches[0]?.score ?? 0;
    return {
      document_id: document.id,
      document: document.name,
      period: document.period,
      found: bestScore >= weakMatch,
      passages: matches.map((match) => ({
        page: match.page,
        url: url && `${url}#page=${match.page}`,
        text: match.text,
        score: Math.round(match.score * 1000) / 1000,
      })),
    };
  });
  return JSON.stringify({ query: args.query, results });
}
