import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod/v4";

// trivago's public MCP server compares live hotel prices across booking sites. It needs no
// API key. See https://mcp.trivago.com/docs.
const serverUrl = new URL("https://mcp.trivago.com/mcp");

// The search filters trivago supports, with the labels the form shows.
export const amenities: Record<string, string> = {
  freeWiFi: "Free WiFi",
  breakfastIncluded: "Breakfast included",
  freeCancellation: "Free cancellation",
  airConditioning: "Air conditioning",
  parking: "Parking",
  pool: "Pool",
  gym: "Gym",
  spa: "Spa",
  kitchen: "Kitchen",
  petFriendly: "Pet friendly",
};
export const guestRatings = ["7.0", "7.5", "8.0", "8.5"];
// The currencies trivago can show prices in.
// prettier-ignore
export const currencies = [
  "AED", "ARS", "AUD", "BRL", "CAD", "CHF", "CLP", "CNY", "COP", "CZK", "DKK", "EGP", "EUR",
  "GBP", "HKD", "HUF", "IDR", "ILS", "INR", "JPY", "KRW", "MXN", "MYR", "NOK", "NZD", "PEN",
  "PHP", "PLN", "RON", "RUB", "SAR", "SEK", "SGD", "THB", "TRY", "TWD", "UAH", "USD", "VND",
  "ZAR",
];

const accommodationSchema = z.object({
  accommodation_id: z.string(),
  accommodation_name: z.string(),
  accommodation_url: z.string(),
  advertisers: z.string().nullish(),
  price_per_night: z.string(),
  price_per_stay: z.string(),
  hotel_rating: z.number().nullish(),
  review_rating: z.string().nullish(),
  review_count: z.string().nullish(),
  top_amenities: z.string().nullish(),
  distance: z.string().nullish(),
  main_image: z.string().nullish(),
});
export type Accommodation = z.infer<typeof accommodationSchema>;

export type AccommodationSearch = {
  query: string;
  arrival: string;
  departure: string;
  adults: number;
  children: number;
  children_ages?: string;
  rooms: number;
  currency: string;
  hotel_rating?: Record<string, boolean>;
  review_rating?: Record<string, boolean>;
  filters?: Record<string, boolean>;
};

// Call trivago-accommodation-search and keep only the structured hotel list. The result also
// carries every photo as image data and formatting instructions meant for the model; this app
// treats third-party output as data, so neither reaches the model.
export async function searchAccommodations(search: AccommodationSearch, signal?: AbortSignal) {
  const client = new Client({ name: "openui-booking-assistant", version: "0.1.0" });
  await client.connect(new StreamableHTTPClientTransport(serverUrl), { signal });
  try {
    const result = await client.callTool(
      { name: "trivago-accommodation-search", arguments: search },
      undefined,
      { signal, timeout: 45_000 },
    );
    if (result.isError) {
      const content = result.content as { type: string; text?: string }[];
      throw new Error(
        content.find((part) => part.type === "text")?.text ?? "trivago search failed.",
      );
    }
    return z
      .object({ accommodations: z.array(accommodationSchema) })
      .parse(result.structuredContent).accommodations;
  } finally {
    await client.close();
  }
}
