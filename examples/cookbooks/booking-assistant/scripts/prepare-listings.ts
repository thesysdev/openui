import { parse } from "csv-parse";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createGunzip } from "node:zlib";
import { addDays, amenities, daysBetween, neighbourhoods, schema, source } from "../src/lib/stays";

// Inside Airbnb publishes a new snapshot every few months. Use the latest one for Lisbon.
const page = await fetch(source.url, { signal: AbortSignal.timeout(30_000) });
if (!page.ok) throw new Error(`Inside Airbnb download page: HTTP ${page.status}. Retry later.`);
const snapshot = [
  ...(await page.text()).matchAll(
    /data\.insideairbnb\.com\/portugal\/lisbon\/lisbon\/(\d{4}-\d{2}-\d{2})\/data\/listings\.csv\.gz/g,
  ),
]
  .map((match) => match[1])
  .sort()
  .at(-1);
if (!snapshot) throw new Error("No Lisbon snapshot is listed on the Inside Airbnb download page.");

// Download each file once per snapshot; later runs reuse it.
await mkdir("data", { recursive: true });
async function download(file: string) {
  const path = resolve("data", `lisbon-${snapshot}-${file}`);
  if (existsSync(path)) return path;
  console.log(`Downloading ${file} from the ${snapshot} snapshot…`);
  const response = await fetch(
    `https://data.insideairbnb.com/portugal/lisbon/lisbon/${snapshot}/data/${file}`,
    { signal: AbortSignal.timeout(600_000) },
  );
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}. Retry later.`);
  if (bytes.length !== Number(response.headers.get("content-length") ?? bytes.length))
    throw new Error(`${file}: the download was incomplete. Run the script again.`);
  await writeFile(path, bytes);
  return path;
}
const rows = (path: string): AsyncIterable<Record<string, string>> =>
  createReadStream(path)
    .pipe(createGunzip())
    .pipe(parse({ columns: true }));

// Inside Airbnb drops accented letters from parish names, so match them without accents.
const parishes = new Map(
  Object.keys(neighbourhoods).map((name) => [name.replace(/[^\x00-\x7f]/g, ""), name]),
);
const roomTypes: Record<string, string> = {
  "Entire home/apt": "entire_place",
  "Private room": "private_room",
  "Hotel room": "hotel_room",
};

// Keep well-reviewed, bookable listings in the city of Lisbon. This keeps the database
// small while leaving thousands of real options.
type Row = (string | number | null)[];
const listings = new Map<string, Row>();
const listingsFile = await download("listings.csv.gz");
const calendarFile = await download("calendar.csv.gz");
console.log("Reading listings…");
for await (const listing of rows(listingsFile)) {
  const neighbourhood = parishes.get(listing.neighbourhood_cleansed);
  const roomType = roomTypes[listing.room_type];
  const price = Number(listing.price.replace(/[$,]/g, ""));
  if (
    listing.neighbourhood_group_cleansed !== "Lisboa" ||
    !neighbourhood ||
    !roomType ||
    !(price > 0) ||
    listing.has_availability !== "t" ||
    Number(listing.number_of_reviews) < 20 ||
    Number(listing.review_scores_rating) < 4.7
  )
    continue;
  const labels = JSON.parse(listing.amenities) as string[];
  const keys = Object.entries(amenities)
    .filter(([, amenity]) => labels.some(amenity.matches))
    .map(([key]) => key);
  const count = (value: string) => (value ? Number(value) : null);
  listings.set(listing.id, [
    listing.id,
    listing.name,
    neighbourhood,
    roomType,
    listing.property_type,
    Number(listing.accommodates),
    count(listing.bedrooms),
    count(listing.beds),
    listing.bathrooms_text || null,
    price,
    Number(listing.minimum_nights),
    Number(listing.maximum_nights),
    Number(listing.review_scores_rating),
    Number(listing.number_of_reviews),
    JSON.stringify(keys),
  ]);
}

// The calendar has one row per listing and night: store each listing's nights as a string.
console.log("Reading the availability calendar…");
const nights = new Map([...listings.keys()].map((id) => [id, Array<string>(400).fill("0")]));
let lastNight = 0;
for await (const night of rows(calendarFile)) {
  const days = nights.get(night.listing_id);
  const index = daysBetween(snapshot, night.date);
  if (!days || index < 0 || index >= days.length) continue;
  days[index] = night.available === "t" ? "1" : "0";
  lastNight = Math.max(lastNight, index);
}

// Build a fresh file, then swap it in so a failed import never leaves a partial database.
const temporary = resolve("data", `stays-${process.pid}.sqlite`);
const db = new DatabaseSync(temporary);
let closed = false;
try {
  db.exec(schema);
  const meta = db.prepare("INSERT INTO meta VALUES (?, ?)");
  meta.run("snapshot", snapshot);
  meta.run("calendar_start", snapshot);
  meta.run("calendar_end", addDays(snapshot, lastNight + 1));
  const insert = db.prepare(`INSERT INTO listings VALUES (${Array(16).fill("?").join(", ")})`);
  db.exec("BEGIN");
  for (const [id, row] of listings)
    insert.run(
      ...row,
      nights
        .get(id)!
        .slice(0, lastNight + 1)
        .join(""),
    );
  db.exec("COMMIT");
  db.close();
  closed = true;
  await rename(temporary, resolve("data", "stays.sqlite"));
  console.log(
    `Prepared ${listings.size} Lisbon listings with availability from ${snapshot} to ${addDays(snapshot, lastNight)}.`,
  );
} catch (error) {
  if (!closed) db.close();
  await rm(temporary, { force: true });
  throw error;
}
