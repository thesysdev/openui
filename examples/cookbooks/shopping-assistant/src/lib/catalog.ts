import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { similarity } from "./embeddings";

// The catalog index: every product's text and embedding, built by `npm run prepare:catalog`.
// It holds what rarely changes, such as descriptions, options, and photos, so search can rank
// products by meaning. Prices and stock always come from the store at answer time.

export type Photo = { url: string; label: string };
export type IndexedProduct = {
  id: string;
  title: string;
  // The indexed price, used only to drop clearly over-budget products before the live check.
  price: number;
  photos: Photo[];
  embedding: Float32Array;
};

export const catalogPath = () => resolve(process.cwd(), "data/catalog.sqlite");

export function createSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE products (id TEXT PRIMARY KEY, title TEXT NOT NULL, text TEXT NOT NULL,
      price REAL NOT NULL, photos TEXT NOT NULL, embedding BLOB NOT NULL);
  `);
}

// Read the whole index once; about 1,000 products fit in a few megabytes of memory.
let products: IndexedProduct[] | null = null;
function loadCatalog() {
  if (products) return products;
  if (!existsSync(catalogPath()))
    throw new Error("The catalog isn't indexed yet. Run npm run prepare:catalog, then retry.");
  const db = new DatabaseSync(catalogPath(), { readOnly: true });
  try {
    const rows = db.prepare("SELECT id, title, price, photos, embedding FROM products").all() as {
      id: string;
      title: string;
      price: number;
      photos: string;
      embedding: Uint8Array;
    }[];
    products = rows.map((row) => ({
      id: row.id,
      title: row.title,
      price: row.price,
      photos: JSON.parse(row.photos) as Photo[],
      embedding: new Float32Array(new Uint8Array(row.embedding).buffer),
    }));
    return products;
  } finally {
    db.close();
  }
}

// The products closest in meaning to the request, best first.
export function rankByMeaning(request: Float32Array, limit: number) {
  return loadCatalog()
    .map((product) => ({ product, score: similarity(request, product.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => product);
}

// Pick `count` of the ranked products, trading closeness to the request against closeness to
// the products already picked (maximal marginal relevance). A large catalog sells near-copies of
// one product, such as the same sweater in several prints, and they would otherwise fill every
// result.
export function diverse(request: Float32Array, ranked: IndexedProduct[], count: number) {
  const relevance = 0.7;
  const picked: IndexedProduct[] = [];
  const left = [...ranked];
  while (picked.length < count && left.length) {
    let best = 0;
    let bestScore = -Infinity;
    left.forEach((product, index) => {
      const overlap = Math.max(0, ...picked.map((p) => similarity(p.embedding, product.embedding)));
      const score = relevance * similarity(request, product.embedding) - (1 - relevance) * overlap;
      if (score > bestScore) [best, bestScore] = [index, score];
    });
    picked.push(...left.splice(best, 1));
  }
  return picked;
}
