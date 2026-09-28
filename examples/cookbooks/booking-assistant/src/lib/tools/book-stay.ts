import { randomBytes } from "node:crypto";
import { z } from "zod/v4";
import {
  bookingWindow,
  daysBetween,
  isOpen,
  neighbourhoods,
  openDatabase,
  type BookingWindow,
  type Listing,
} from "../stays";
import { checkDates, tripSchema } from "./search-stays";

// The book_stay function tool. Bookings are simulated: they are saved in the local
// database, and nothing is charged or sent to a host.

export function bookStayTool(window: BookingWindow) {
  return {
    type: "function" as const,
    name: "book_stay",
    description: `Book a stay after the guest confirmed its summary. Check-in is from ${window.first}; check-out is up to ${window.last}. Returns a confirmation code.`,
    parameters: {
      type: "object",
      properties: {
        listing_id: { type: "string", description: "The id returned by search_stays." },
        check_in: { type: "string", description: "YYYY-MM-DD" },
        check_out: { type: "string", description: "YYYY-MM-DD" },
        guests: { type: "integer", minimum: 1, maximum: 16 },
        guest_name: { type: "string" },
        guest_email: { type: "string" },
      },
      required: ["listing_id", "check_in", "check_out", "guests", "guest_name", "guest_email"],
      additionalProperties: false,
    },
    strict: true,
  };
}

// Validate arguments again on the server; the model's output is untrusted input.
const argsSchema = z
  .object({
    ...tripSchema.shape,
    listing_id: z.string().regex(/^\d{1,20}$/, "Choose a stay returned by search_stays."),
    guest_name: z.string().trim().min(2, "Enter the guest's full name.").max(80),
    guest_email: z.email("Enter a valid email address.").max(120),
  })
  .strict();

export async function executeBookStay(argsJson: string, { signal }: { signal?: AbortSignal } = {}) {
  signal?.throwIfAborted();
  const args = argsSchema.parse(JSON.parse(argsJson));
  tripSchema.parse(args);
  const db = openDatabase({ readOnly: false });
  try {
    const window = bookingWindow(db);
    checkDates(window, args.check_in, args.check_out);
    const nights = daysBetween(args.check_in, args.check_out);
    const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(args.listing_id) as
      Listing | undefined;
    if (!listing) throw new RangeError("Choose a stay returned by search_stays.");
    if (listing.accommodates < args.guests)
      throw new RangeError(`${listing.name} sleeps up to ${listing.accommodates} guests.`);
    if (nights < listing.minimum_nights || nights > listing.maximum_nights)
      throw new RangeError(
        `${listing.name} takes stays of ${listing.minimum_nights} to ${listing.maximum_nights} nights.`,
      );

    // Check and save in one transaction so two confirmations cannot take the same nights.
    db.exec("BEGIN IMMEDIATE");
    try {
      if (!isOpen(db, listing, window, args.check_in, args.check_out))
        throw new RangeError(`${listing.name} is no longer open for these dates.`);
      const code = `LIS-${randomBytes(3).toString("hex").toUpperCase()}`;
      const total = Math.round(listing.price * nights * 100) / 100;
      db.prepare("INSERT INTO bookings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        code,
        listing.id,
        args.check_in,
        args.check_out,
        args.guests,
        args.guest_name,
        args.guest_email,
        total,
        new Date().toISOString(),
      );
      db.exec("COMMIT");
      return JSON.stringify({
        confirmation_code: code,
        stay: listing.name,
        neighbourhood: `${listing.neighbourhood} (${neighbourhoods[listing.neighbourhood]})`,
        check_in: args.check_in,
        check_out: args.check_out,
        nights,
        guests: args.guests,
        guest_name: args.guest_name,
        guest_email: args.guest_email,
        price_per_night: listing.price,
        total,
        note: "Simulated booking saved in this app. Nothing was charged or sent to the host.",
      });
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } finally {
    db.close();
  }
}
