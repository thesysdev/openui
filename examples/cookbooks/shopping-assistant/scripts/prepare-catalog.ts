import { existsSync } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod/v4";
import { catalogPath, createSchema, type Photo } from "../src/lib/catalog";
import { embed } from "../src/lib/embeddings";
import { plainText, resized, store } from "../src/lib/shopify";

// Index the store's catalog for search by meaning: read every product from the store's public
// product feed, embed each product's text, and save the vectors with the photos and price.
// Run it again whenever the catalog changes; answers always check live prices and stock.

// Read keys the way Next.js does: .env.local first, then .env. Existing variables win.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

// The store's catalog search ranks by relevance and returns only its best matches, so it can't
// list a whole catalog. Every Shopify online store also serves its published products at
// /products.json, 250 per page, with no key.
const feedProduct = z.object({
  id: z.number(),
  title: z.string(),
  body_html: z.string().nullish(),
  product_type: z.string().nullish(),
  tags: z.array(z.string()),
  options: z.array(z.object({ name: z.string(), values: z.array(z.string()) })),
  variants: z.array(
    z.object({
      price: z.string(),
      option1: z.string().nullish(),
      option2: z.string().nullish(),
      option3: z.string().nullish(),
      featured_image: z.object({ src: z.string() }).nullish(),
    }),
  ),
  images: z.array(z.object({ src: z.string() })),
});
type FeedProduct = z.infer<typeof feedProduct>;

async function readFeed() {
  const products: FeedProduct[] = [];
  for (let page = 1; ; page++) {
    const response = await fetch(`https://${store}/products.json?limit=250&page=${page}`);
    if (!response.ok) throw new Error(`${store}/products.json returned ${response.status}`);
    const batch = z.object({ products: z.array(feedProduct) }).parse(await response.json());
    products.push(...batch.products);
    process.stdout.write(`\rRead ${products.length} products from ${store}…`);
    if (batch.products.length < 250) break;
  }
  console.log();
  return products;
}

// What the embedding sees: the title, description, type, tags, and every option value.
function productText(product: FeedProduct) {
  const options = product.options.filter((option) => option.name !== "Title");
  return [
    product.title,
    plainText(product.body_html ?? ""),
    product.product_type ? `Type: ${product.product_type}` : "",
    product.tags.length ? `Tags: ${product.tags.join(", ")}` : "",
    ...options.map((option) => `${option.name}: ${option.values.join(", ")}`),
  ]
    .filter(Boolean)
    .join("\n");
}

// One photo per color: each color's photo is attached to its variants. Each photo is labelled
// with the variant's options other than size, such as "Black", so an answer can show the color.
function productPhotos(product: FeedProduct): Photo[] {
  const byUrl = new Map<string, string>();
  for (const variant of product.variants) {
    if (!variant.featured_image) continue;
    const url = variant.featured_image.src.split("?")[0];
    if (byUrl.has(url)) continue;
    const values = [variant.option1, variant.option2, variant.option3];
    const label = product.options
      .map((option, index) => (/size|title/i.test(option.name) ? null : values[index]))
      .filter(Boolean)
      .join(" / ");
    byUrl.set(url, label || product.title);
  }
  for (const image of product.images)
    if (!byUrl.has(image.src.split("?")[0])) byUrl.set(image.src.split("?")[0], product.title);
  return [...byUrl].slice(0, 4).map(([url, label]) => ({ url: resized(url), label }));
}

const products = await readFeed();
const texts = products.map(productText);
console.log(`Embedding ${texts.length} products…`);
const embeddings: Float32Array[] = [];
for (let start = 0; start < texts.length; start += 100)
  embeddings.push(...(await embed(texts.slice(start, start + 100))));

// Build a fresh database, then swap it in so a failed run never leaves a partial one.
await mkdir("data", { recursive: true });
const temporary = resolve("data", `catalog-${process.pid}.sqlite`);
const db = new DatabaseSync(temporary);
let closed = false;
try {
  createSchema(db);
  const insert = db.prepare("INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?)");
  db.exec("BEGIN");
  products.forEach((product, index) => {
    insert.run(
      // The catalog MCP tools name products by global id.
      `gid://shopify/Product/${product.id}`,
      product.title,
      texts[index],
      Math.min(...product.variants.map((variant) => Number(variant.price))),
      JSON.stringify(productPhotos(product)),
      Buffer.from(embeddings[index].buffer),
    );
  });
  db.exec("COMMIT");
  db.close();
  closed = true;
  await rename(temporary, catalogPath());
  console.log(`Indexed ${products.length} products in data/catalog.sqlite.`);
} catch (error) {
  if (!closed) db.close();
  await rm(temporary, { force: true });
  throw error;
}
