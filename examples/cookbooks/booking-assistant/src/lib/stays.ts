import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

// Lisbon listings and nightly availability from Inside Airbnb, prepared by
// npm run prepare:listings. Bookings made in the chat are stored in the same file.

export const source = {
  name: "Inside Airbnb",
  url: "https://insideairbnb.com/get-the-data/",
  license: "CC BY 4.0",
};

// Parish names from the data, with the areas travelers know them by.
export const neighbourhoods: Record<string, string> = {
  "Santa Maria Maior": "Alfama, Baixa, Castelo, Mouraria",
  Misericórdia: "Bairro Alto, Chiado, Cais do Sodré",
  Arroios: "Arroios, Anjos, Intendente",
  "Santo António": "Avenida da Liberdade, Príncipe Real",
  "São Vicente": "Graça",
  Estrela: "Lapa, Madragoa",
  "Avenidas Novas": "Saldanha",
  "Penha de França": "Penha de França",
  "Campo de Ourique": "Campo de Ourique",
  Areeiro: "Areeiro",
  "Parque das Nações": "Oriente, the former Expo site",
  Campolide: "Campolide",
  Alcântara: "Alcântara, LX Factory",
  Belém: "Belém",
  Alvalade: "Alvalade",
  Ajuda: "Ajuda",
  Olivais: "Olivais, near the airport",
  "São Domingos de Benfica": "São Domingos de Benfica",
  Lumiar: "Lumiar",
  Beato: "Beato",
  Marvila: "Marvila",
  Benfica: "Benfica",
  "Santa Clara": "Santa Clara",
  Carnide: "Carnide",
};

export const roomTypes: Record<string, string> = {
  entire_place: "Entire place",
  private_room: "Private room",
  hotel_room: "Hotel room",
};

// Amenities people filter by, matched against Airbnb's amenity labels.
export const amenities: Record<string, { label: string; matches: (name: string) => boolean }> = {
  wifi: { label: "Wifi", matches: (name) => /\bwifi\b/i.test(name) },
  kitchen: { label: "Kitchen", matches: (name) => name === "Kitchen" },
  air_conditioning: {
    label: "Air conditioning",
    matches: (name) => /air conditioning|^AC -/i.test(name),
  },
  washer: { label: "Washer", matches: (name) => /washer/i.test(name) && !/dishwasher/i.test(name) },
  workspace: { label: "Dedicated workspace", matches: (name) => name === "Dedicated workspace" },
  free_parking: { label: "Free parking", matches: (name) => /^free (street )?parking/i.test(name) },
  elevator: { label: "Elevator", matches: (name) => name === "Elevator" },
  balcony: { label: "Balcony or patio", matches: (name) => /patio or balcony/i.test(name) },
  self_check_in: { label: "Self check-in", matches: (name) => name === "Self check-in" },
  pets_allowed: { label: "Pets allowed", matches: (name) => name === "Pets allowed" },
  crib: { label: "Crib", matches: (name) => name === "Crib" },
};

export type Listing = {
  id: string;
  name: string;
  neighbourhood: string;
  room_type: string;
  property_type: string;
  accommodates: number;
  bedrooms: number | null;
  beds: number | null;
  bathrooms: string | null;
  price: number;
  minimum_nights: number;
  maximum_nights: number;
  rating: number;
  reviews: number;
  amenities: string;
  availability: string;
};

export const schema = `
  CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE listings (id TEXT PRIMARY KEY, name TEXT NOT NULL, neighbourhood TEXT NOT NULL,
    room_type TEXT NOT NULL, property_type TEXT NOT NULL, accommodates INTEGER NOT NULL,
    bedrooms INTEGER, beds INTEGER, bathrooms TEXT, price REAL NOT NULL,
    minimum_nights INTEGER NOT NULL, maximum_nights INTEGER NOT NULL, rating REAL NOT NULL,
    reviews INTEGER NOT NULL, amenities TEXT NOT NULL,
    -- One character per night from meta.calendar_start: 1 is open, 0 is taken.
    availability TEXT NOT NULL);
  CREATE TABLE bookings (code TEXT PRIMARY KEY, listing_id TEXT NOT NULL REFERENCES listings(id),
    check_in TEXT NOT NULL, check_out TEXT NOT NULL, guests INTEGER NOT NULL,
    guest_name TEXT NOT NULL, guest_email TEXT NOT NULL, total REAL NOT NULL,
    created_at TEXT NOT NULL);
`;

export function openDatabase({ readOnly = true } = {}) {
  const path = resolve(process.cwd(), "data/stays.sqlite");
  if (!existsSync(path))
    throw new Error("Listings not prepared. Run npm run prepare:listings, then retry.");
  return new DatabaseSync(path, { readOnly });
}

const DAY = 86_400_000;
export const isoDate = /^\d{4}-\d{2}-\d{2}$/;
export const addDays = (date: string, days: number) =>
  new Date(Date.parse(date) + days * DAY).toISOString().slice(0, 10);
export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / DAY);

export type BookingWindow = {
  today: string;
  weekday: string;
  first: string; // earliest check-in
  last: string; // latest check-out
  calendarStart: string;
  snapshot: string;
};

// Guests can book nights from today (in Lisbon) until the calendar ends.
export function bookingWindow(db: DatabaseSync): BookingWindow {
  const meta = Object.fromEntries(
    (db.prepare("SELECT key, value FROM meta").all() as { key: string; value: string }[]).map(
      (row) => [row.key, row.value],
    ),
  );
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(now);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Lisbon",
    weekday: "long",
  }).format(now);
  return {
    today,
    weekday,
    first: today > meta.calendar_start ? today : meta.calendar_start,
    last: meta.calendar_end,
    calendarStart: meta.calendar_start,
    snapshot: meta.snapshot,
  };
}

// A stay is open when every night from check-in to the night before check-out is free
// in the calendar and not already booked in this app.
export function isOpen(
  db: DatabaseSync,
  listing: Pick<Listing, "id" | "availability">,
  window: BookingWindow,
  checkIn: string,
  checkOut: string,
) {
  const start = daysBetween(window.calendarStart, checkIn);
  const nights = daysBetween(checkIn, checkOut);
  const calendar = listing.availability.slice(start, start + nights);
  if (start < 0 || calendar.length !== nights || calendar.includes("0")) return false;
  const overlap = db
    .prepare(
      "SELECT 1 FROM bookings WHERE listing_id = ? AND check_in < ? AND check_out > ? LIMIT 1",
    )
    .get(listing.id, checkOut, checkIn);
  return !overlap;
}
