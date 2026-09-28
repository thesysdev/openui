import { z } from "zod/v4";
import {
  amenities,
  currencies,
  guestRatings,
  searchAccommodations,
  type Accommodation,
} from "../trivago";

// The search_stays function tool: its JSON schema for Gateway, argument validation, the trivago
// search, and the executor the tool loop calls.

// Today's date where the server runs, as YYYY-MM-DD.
export const today = () => new Intl.DateTimeFormat("en-CA").format(new Date());

export function searchStaysTool() {
  return {
    type: "function" as const,
    function: {
      name: "search_stays",
      description:
        "Search hotels and other stays with live prices from trivago, which compares booking sites. Returns the best matches with prices, ratings, a photo, and a booking link.",
      parameters: {
        type: "object",
        properties: {
          destination: {
            type: "string",
            description: "A city, neighbourhood, or landmark, such as 'Alfama, Lisbon'.",
          },
          check_in: { type: "string", description: "YYYY-MM-DD, the day the guests arrive." },
          check_out: { type: "string", description: "YYYY-MM-DD, the day they leave." },
          adults: { type: "integer", minimum: 1, maximum: 16 },
          children_ages: {
            type: "array",
            items: { type: "integer", minimum: 0, maximum: 17 },
            description: "One age per child. Empty when there are no children.",
          },
          rooms: { type: "integer", minimum: 1, maximum: 8 },
          currency: { type: "string", enum: currencies },
          max_price_per_night: {
            type: ["number", "null"],
            description: "In the chosen currency. Null for no limit.",
          },
          stars: {
            type: "array",
            items: { type: "integer", minimum: 1, maximum: 5 },
            description: "Hotel star ratings to include. Empty for any.",
          },
          min_guest_rating: { type: "string", enum: ["any", ...guestRatings] },
          amenities: { type: "array", items: { type: "string", enum: Object.keys(amenities) } },
          sort: { type: "string", enum: ["recommended", "lowest_price", "top_rated"] },
        },
        required: [
          "destination",
          "check_in",
          "check_out",
          "adults",
          "children_ages",
          "rooms",
          "currency",
          "max_price_per_night",
          "stars",
          "min_guest_rating",
          "amenities",
          "sort",
        ],
        additionalProperties: false,
      },
      strict: true,
    },
  };
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const nightsBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

// Validate arguments again on the server; the model's output is untrusted input.
const argsSchema = z
  .object({
    destination: z.string().trim().min(2).max(120),
    check_in: z.string().regex(isoDate, "Use YYYY-MM-DD dates."),
    check_out: z.string().regex(isoDate, "Use YYYY-MM-DD dates."),
    adults: z.number().int().min(1).max(16),
    children_ages: z.array(z.number().int().min(0).max(17)).max(8),
    rooms: z.number().int().min(1).max(8),
    currency: z.enum(currencies),
    max_price_per_night: z.number().positive().nullable(),
    stars: z.array(z.number().int().min(1).max(5)),
    min_guest_rating: z.enum(["any", ...guestRatings]),
    amenities: z.array(z.enum(Object.keys(amenities))),
    sort: z.enum(["recommended", "lowest_price", "top_rated"]),
  })
  .strict()
  .superRefine((args, ctx) => {
    const nights = nightsBetween(args.check_in, args.check_out);
    if (args.check_in < today())
      ctx.addIssue({ code: "custom", message: "Check-in must be today or later." });
    if (!(nights >= 1))
      ctx.addIssue({ code: "custom", message: "Check-out must be after check-in." });
    if (nights > 30) ctx.addIssue({ code: "custom", message: "Stays can be up to 30 nights." });
    if (args.rooms > args.adults)
      ctx.addIssue({ code: "custom", message: "Each room needs at least one adult." });
  });

// trivago formats prices for display, such as "215€" or "$1,215".
const amount = (price: string) => Number(price.replace(/[^\d.]/g, ""));
const guestRating = (stay: Accommodation) => Number(stay.review_rating) || 0;

export async function executeSearchStays(
  argsJson: string,
  { signal }: { signal?: AbortSignal } = {},
) {
  signal?.throwIfAborted();
  const args = argsSchema.parse(JSON.parse(argsJson));
  const found = await searchAccommodations(
    {
      query: args.destination,
      arrival: args.check_in,
      departure: args.check_out,
      adults: args.adults,
      children: args.children_ages.length,
      ...(args.children_ages.length ? { children_ages: args.children_ages.join("-") } : {}),
      rooms: args.rooms,
      currency: args.currency,
      hotel_rating: Object.fromEntries(args.stars.map((stars) => [`${stars}star`, true])),
      review_rating:
        args.min_guest_rating === "any"
          ? {}
          : { [`rating${args.min_guest_rating.replace(".", "")}`]: true },
      filters: Object.fromEntries(args.amenities.map((key) => [key, true])),
    },
    signal,
  );

  // trivago has no price filter, so apply the budget here and report what it left out.
  const inBudget = found.filter(
    (stay) =>
      args.max_price_per_night === null || amount(stay.price_per_night) <= args.max_price_per_night,
  );
  const overBudget = found.filter((stay) => !inBudget.includes(stay));
  if (args.sort === "lowest_price")
    inBudget.sort((a, b) => amount(a.price_per_night) - amount(b.price_per_night));
  if (args.sort === "top_rated") inBudget.sort((a, b) => guestRating(b) - guestRating(a));

  return JSON.stringify({
    destination: args.destination,
    check_in: args.check_in,
    check_out: args.check_out,
    nights: nightsBetween(args.check_in, args.check_out),
    currency: args.currency,
    matches: inBudget.length,
    stays: inBudget.slice(0, 6).map((stay) => ({
      id: stay.accommodation_id,
      name: stay.accommodation_name,
      stars: stay.hotel_rating ?? null,
      guest_rating: stay.review_rating ?? null,
      reviews: stay.review_count ?? null,
      price_per_night: stay.price_per_night,
      total: stay.price_per_stay,
      amenities: stay.top_amenities ?? null,
      location: stay.distance ?? null,
      photo: stay.main_image ?? null,
      booking_site: stay.advertisers ?? null,
      url: stay.accommodation_url,
    })),
    over_budget: overBudget.length
      ? {
          stays: overBudget.length,
          cheapest_per_night: Math.min(...overBudget.map((stay) => amount(stay.price_per_night))),
        }
      : null,
    note: "Live prices from trivago. They can change until the guest books on the booking site.",
  });
}
