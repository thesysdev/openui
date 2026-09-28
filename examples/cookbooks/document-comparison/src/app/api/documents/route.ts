import { listDocuments, openDatabase, sources } from "../../../lib/documents";

export const runtime = "nodejs";

// The document library shown on the Documents page.
export async function GET() {
  let db;
  try {
    db = openDatabase();
    const passages = new Map(
      (
        db.prepare("SELECT document_id, COUNT(*) AS n FROM chunks GROUP BY document_id").all() as {
          document_id: string;
          n: number;
        }[]
      ).map((row) => [row.document_id, row.n]),
    );
    const documents = listDocuments(db).map((document) => ({
      ...document,
      passages: passages.get(document.id) ?? 0,
      url: sources.find((source) => source.id === document.id)?.url ?? null,
    }));
    return Response.json({ documents }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Prepare the documents with npm run prepare:documents." },
      { status: 503 },
    );
  } finally {
    db?.close();
  }
}
