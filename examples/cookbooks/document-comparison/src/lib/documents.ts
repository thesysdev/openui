import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

// The sample documents: each company's latest annual report (Form 10-K), as the PDF it
// publishes on its investor relations site. Add your own PDFs to documents/ as well.
export const sources = [
  {
    id: "nvidia",
    name: "NVIDIA 10-K, fiscal 2026",
    url: "https://investor.nvidia.com/files/doc_financials/2026/q4/10K-NVDA.pdf",
    period: "Fiscal year ended January 25, 2026",
  },
  {
    id: "amd",
    name: "AMD 10-K, fiscal 2025",
    url: "https://ir.amd.com/financial-information/sec-filings/content/0000002488-26-000018/0000002488-26-000018.pdf",
    period: "Fiscal year ended December 27, 2025",
  },
  {
    id: "intel",
    name: "Intel 10-K, fiscal 2025",
    url: "https://www.intc.com/filings-reports/all-sec-filings/content/0000050863-26-000011/0000050863-26-000011.pdf",
    period: "Fiscal year ended December 27, 2025",
  },
];

export const embeddingModel = "text-embedding-3-small";

export type Document = { id: string; name: string; period: string | null; pages: number };

export function createSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE documents (id TEXT PRIMARY KEY, name TEXT NOT NULL, period TEXT,
      pages INTEGER NOT NULL);
    CREATE TABLE chunks (id INTEGER PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id),
      page INTEGER NOT NULL, text TEXT NOT NULL, embedding BLOB NOT NULL);
  `);
}

export function openDatabase() {
  const path = resolve(process.cwd(), "data/documents.sqlite");
  if (!existsSync(path))
    throw new Error("Documents not prepared. Run npm run prepare:documents, then retry.");
  return new DatabaseSync(path, { readOnly: true });
}

export function listDocuments(db: DatabaseSync): Document[] {
  return db
    .prepare("SELECT id, name, period, pages FROM documents ORDER BY rowid")
    .all() as Document[];
}
