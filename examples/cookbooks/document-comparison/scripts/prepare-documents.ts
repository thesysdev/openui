import { existsSync, readdirSync, readFileSync } from "node:fs";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { extractText, getDocumentProxy } from "unpdf";
import { createSchema, sources } from "../src/lib/documents";
import { embed } from "../src/lib/embeddings";

// Read keys the way Next.js does: .env.local first, then .env. Existing variables win.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

type Input = { id: string; name: string; period: string | null; path: string };

// Download each sample PDF once; later runs reuse the cached file.
await mkdir("data/pdfs", { recursive: true });
const inputs: Input[] = [];
for (const source of sources) {
  const path = resolve("data/pdfs", `${source.id}.pdf`);
  if (!existsSync(path)) {
    console.log(`Downloading ${source.name}…`);
    const response = await fetch(source.url, {
      headers: { "User-Agent": "Mozilla/5.0 (OpenUI document comparison cookbook)" },
      signal: AbortSignal.timeout(300_000),
    });
    const bytes = Buffer.from(await response.arrayBuffer());
    // A cut-off download still starts with %PDF, so also require the end-of-file marker.
    if (!response.ok || !bytes.subarray(0, 5).toString().startsWith("%PDF"))
      throw new Error(`${source.name}: HTTP ${response.status}. Retry later.`);
    if (!bytes.subarray(-2048).toString("latin1").includes("%%EOF"))
      throw new Error(`${source.name}: the download was incomplete. Run the script again.`);
    await writeFile(path, bytes);
  }
  inputs.push({ id: source.id, name: source.name, period: source.period, path });
}

// Your own PDFs: every file in documents/ is compared alongside the samples.
if (existsSync("documents")) {
  for (const file of readdirSync("documents").filter((name) =>
    name.toLowerCase().endsWith(".pdf"),
  )) {
    const name = basename(file, ".pdf");
    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    inputs.push({ id, name, period: null, path: resolve("documents", file) });
  }
}

// Split each page into overlapping passages so every passage keeps its page number.
function passages(text: string, size = 1200, overlap = 200) {
  const clean = text.replace(/\s+/g, " ").trim();
  const result: string[] = [];
  for (let start = 0; start < clean.length; start += size - overlap) {
    result.push(clean.slice(start, start + size));
    if (start + size >= clean.length) break;
  }
  return result.filter((passage) => passage.length > 80);
}

const chunks: { documentId: string; page: number; text: string }[] = [];
const pageCounts = new Map<string, number>();
for (const input of inputs) {
  const pdf = await getDocumentProxy(new Uint8Array(readFileSync(input.path)));
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  pageCounts.set(input.id, totalPages);
  text.forEach((pageText, index) => {
    for (const passage of passages(pageText))
      chunks.push({ documentId: input.id, page: index + 1, text: passage });
  });
  console.log(`Extracted ${input.name}: ${totalPages} pages.`);
}

console.log(`Embedding ${chunks.length} passages…`);
const embeddings: Float32Array[] = [];
for (let start = 0; start < chunks.length; start += 100) {
  const batch = chunks.slice(start, start + 100);
  embeddings.push(...(await embed(batch.map((chunk) => chunk.text))));
}

// Build a fresh database, then swap it in so a failed run never leaves a partial one.
const temporary = resolve("data", `documents-${process.pid}.sqlite`);
const db = new DatabaseSync(temporary);
let closed = false;
try {
  createSchema(db);
  const insertDocument = db.prepare("INSERT INTO documents VALUES (?, ?, ?, ?)");
  const insertChunk = db.prepare(
    "INSERT INTO chunks (document_id, page, text, embedding) VALUES (?, ?, ?, ?)",
  );
  db.exec("BEGIN");
  for (const input of inputs)
    insertDocument.run(input.id, input.name, input.period, pageCounts.get(input.id)!);
  chunks.forEach((chunk, index) =>
    insertChunk.run(
      chunk.documentId,
      chunk.page,
      chunk.text,
      Buffer.from(embeddings[index].buffer),
    ),
  );
  db.exec("COMMIT");
  db.close();
  closed = true;
  await rename(temporary, resolve("data", "documents.sqlite"));
  console.log(`Prepared ${inputs.length} documents and ${chunks.length} passages.`);
} catch (error) {
  if (!closed) db.close();
  await rm(temporary, { force: true });
  throw error;
}
