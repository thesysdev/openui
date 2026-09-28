import type { DatabaseSync } from "node:sqlite";
import { z } from "zod/v4";
import {
  amenities,
  bookingWindow,
  daysBetween,
  isOpen,
  isoDate,
  neighbourhoods,
  openDatabase,
  roomTypes,
  type BookingWindow,
  type Listing,
} from "../stays";

// The search_stays function tool: its JSON schema for Gateway, argument validation,
// the availability search, and the executor the tool loop calls.

export function searchStaysTool(window: BookingWindow) {
  return {
    type: "function" as const,
    name: "search_stays",
    description: `Find Lisbon stays that are open every night of a trip, from Inside Airbnb's calendar. Check-in is from ${window.first}; check-out is up to ${window.last}. Prices are EUR per night.`,
    parameters: {
      type: "object",
      properties: {
        check_in: { type: "string", description: "YYYY-MM-DD, the day the guests arrive." },
        check_out: { type: "string", description: "YYYY-MM-DD, the day they leave." },
        guests: { type: "integer", minimum: 1, maximum: 16 },
        room_type: { type: "string", enum: ["any", ...Object.keys(roomTypes)] },
        neighbourhoods: {
          type: "array",
          items: { type: "string", enum: Object.keys(neighbourhoods) },
          description: "Empty for anywhere in Lisbon.",
        },
        max_price_per_night: {
          type: ["number", "null"],
          description: "EUR per night. Null for no limit.",
        },
        amenities: { type: "array", items: { type: "string", enum: Object.keys(amenities) } },
        sort: { type: "string", enum: ["top_rated", "lowest_price"] },
      },
      required: [
        "check_in",
        "check_out",
        "guests",
        "room_type",
        "neighbourhoods",
        "max_price_per_night",
        "amenities",
        "sort",
      ],
      additionalProperties: false,
    },
    strict: true,
  };
}

// Validate arguments again on the server; the model's output is untrusted input.
export const tripSchema = z
  .object({
    check_in: z.string().regex(isoDate, "Use YYYY-MM-DD dates."),
    check_out: z.string().regex(isoDate, "Use YYYY-MM-DD dates."),
    guests: z.number().int().min(1).max(16),
  })
  .superRefine((trip, ctx) => {
    const nights = daysBetween(trip.check_in, trip.check_out);
    if (!(nights >= 1))
      ctx.addIssue({ code: "custom", message: "Check-out must be after check-in." });
    if (nights > 28) ctx.addIssue({ code: "custom", message: "Stays can be up to 28 nights." });
  });

const argsSchema = z
  .object({
    ...tripSchema.shape,
    room_type: z.enum(["any", ...Object.keys(roomTypes)]),
    neighbourhoods: z.array(z.enum(Object.keys(neighbourhoods))),
    max_price_per_night: z.number().positive().nullable(),
    amenities: z.array(z.enum(Object.keys(amenities))),
    sort: z.enum(["top_rated", "lowest_price"]),
  })
  .strict();

export function checkDates(window: BookingWindow, checkIn: string, checkOut: string) {
  if (checkIn < window.first) throw new RangeError(`Check-in must be on or after ${window.first}.`);
  if (checkOut > window.last)
    throw new RangeError(`Availability is known only until ${window.last}.`);
}

export async function executeSearchStays(
  argsJson: string,
  { signal }: { signal?: AbortSignal } = {},
) {
  signal?.throwIfAborted();
  const args = argsSchema.parse(JSON.parse(argsJson));
  tripSchema.parse(args);
  const db = openDatabase();
  try {
    return JSON.stringify(searchStays(db, args));
  } finally {
    db.close();
  }
}

function searchStays(db: DatabaseSync, args: z.infer<typeof argsSchema>) {
  const window = bookingWindow(db);
  checkDates(window, args.check_in, args.check_out);
  const nights = daysBetween(args.check_in, args.check_out);

  // Guests and dates are hard requirements. The optional preferences are checked
  // separately so an empty result can say which one to relax.
  const candidates = (
    db
      .prepare(
        "SELECT * FROM listings WHERE accommodates >= ? AND minimum_nights <= ? AND maximum_nights >= ?",
      )
      .all(args.guests, nights, nights) as Listing[]
  ).filter((listing) => isOpen(db, listing, window, args.check_in, args.check_out));
  const preferences = {
    room_type: (listing: Listing) =>
      args.room_type === "any" || listing.room_type === args.room_type,
    neighbourhoods: (listing: Listing) =>
      args.neighbourhoods.length === 0 || args.neighbourhoods.includes(listing.neighbourhood),
    max_price_per_night: (listing: Listing) =>
      args.max_price_per_night === null || listing.price <= args.max_price_per_night,
    amenities: (listing: Listing) =>
      args.amenities.every((key) => JSON.parse(listing.amenities).includes(key)),
  };
  const matchesAll = (listing: Listing, skip?: string) =>
    Object.entries(preferences).every(([name, test]) => name === skip || test(listing));

  const matches = candidates.filter((listing) => matchesAll(listing));
  // When few stays match, count how many each relaxed preference would add.
  const ifRelaxed =
    matches.length >= 3
      ? []
      : Object.keys(preferences)
          .map((preference) => ({
            drop: preference,
            matches: candidates.filter((listing) => matchesAll(listing, preference)).length,
          }))
          .filter((option) => option.matches > matches.length);

  // Weigh each rating by its review count, so a 5.0 from 20 reviews does not outrank
  // a 4.9 from 500.
  const score = (listing: Listing) =>
    (listing.rating * listing.reviews + 4.7 * 50) / (listing.reviews + 50);
  matches.sort((a, b) =>
    args.sort === "lowest_price" ? a.price - b.price || score(b) - score(a) : score(b) - score(a),
  );
  return {
    check_in: args.check_in,
    check_out: args.check_out,
    nights,
    guests: args.guests,
    matches: matches.length,
    stays: matches.slice(0, 5).map((listing) => ({
      id: listing.id,
      name: listing.name,
      neighbourhood: listing.neighbourhood,
      known_as: neighbourhoods[listing.neighbourhood],
      type: listing.property_type,
      sleeps: listing.accommodates,
      bedrooms: listing.bedrooms,
      beds: listing.beds,
      bathrooms: listing.bathrooms,
      price_per_night: listing.price,
      total: Math.round(listing.price * nights * 100) / 100,
      rating: listing.rating,
      reviews: listing.reviews,
      minimum_nights: listing.minimum_nights,
      amenities: JSON.parse(listing.amenities).map((key: string) => amenities[key].label),
      url: `https://www.airbnb.com/rooms/${listing.id}`,
    })),
    if_relaxed: ifRelaxed,
    data: `Inside Airbnb snapshot of ${window.snapshot}. Availability may have changed since.`,
  };
}
