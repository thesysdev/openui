import { additionalRules, examples as defaultExamples } from "@openuidev/intelligent-ui-library";
import { generateSystemPrompt } from "@openuidev/lang-core";
import spec from "../generated/spec.json";
import { amenities, guestRatings } from "./trivago";

// Gateway expects prompt options beside the library, not inside chatLibrary.
const { promptOptions, ...library } = spec;

const addDays = (date: string, days: number) =>
  new Date(Date.parse(date) + days * 86_400_000).toISOString().slice(0, 10);
const day = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

// Syntax guidance only. Hotels, prices, photos, and links always come from search_stays.
// Each example is one step of the booking flow: collect the trip, choose a stay, review it.
function examples(today: string) {
  const friday = addDays(today, (5 - new Date(today).getUTCDay() + 7) % 7);
  const sunday = addDays(friday, 2);
  const tripForm = `root = Col([intro, trip])
intro = Text("Here's what I understood. Fill in anything missing, then find stays.")
trip = Form([destination, check_in, check_out, adults, max_price_per_night, stars, min_guest_rating, amenities, submit])
submit = Button("Find stays", @ToAssistant("Find stays"), "solid", "primary")
destination = Input("Lisbon", "Destination", "text", "City, neighbourhood, or landmark", {required: true})
check_in = DatePicker("${friday}", "Check-in", "${today}", null, {required: true})
check_out = DatePicker("${sunday}", "Check-out", "${addDays(friday, 1)}", null, {required: true})
adults = Input(2, "Adults", "number", null, {required: true, min: 1, max: 16})
max_price_per_night = Input("", "Max price per night (EUR)", "number", "No limit", {min: 1})
stars = Input("", "Hotel stars (comma-separated, e.g. 3, 4)")
min_guest_rating = Select("any", ["any", "8.0", "8.5"], "Minimum guest rating")
amenities = Input("", "Must-haves (comma-separated: freeWiFi, breakfastIncluded, freeCancellation, pool)")
`;
  const chooseStay = `root = Col([header, dates, riverside, castle, choose])
header = Title("Stays in Lisbon for your dates")
dates = Text("${day(friday)} – ${day(sunday)} · 2 nights · 2 adults · 4★")
riverside = Card([Image("https://example.com/riverside.jpg", "Riverside Hotel", 1.5), Title("Riverside Hotel"), Text("€215 a night · €429 total · 4★ · 8.3 (7,960 reviews) · 0.2 km to Praça do Comércio · via Hotel Site")])
castle = Card([Image("https://example.com/castle.jpg", "Castle View Suites", 1.5), Title("Castle View Suites"), Text("€176 a night · €353 total · 4★ · 8.4 (623 reviews) · 0.4 km to the castle · via Booking.com")])
choose = Form([stay, reviewButton, changeButton])
reviewButton = Button("Review stay", @ToAssistant("Review stay"), "solid", "primary")
changeButton = Button("Change search", @ToAssistant("Change search"), "outline")
stay = RadioGroup("", [{value: "https://www.trivago.com/example-riverside-deal", label: "Riverside Hotel"}, {value: "https://www.trivago.com/example-castle-deal", label: "Castle View Suites"}], "Choose a stay", "cards", {required: true})
`;
  const review = `root = Col([header, details, handoff, actions])
header = Title("Review your stay: Riverside Hotel · Lisbon")
details = Table(["Detail", "Value"], [["Check-in", "${day(friday)}"], ["Check-out", "${day(sunday)} · 2 nights"], ["Guests", "2 adults · 1 room"], ["Hotel", "4★ · 8.3 guest rating"], ["Price per night", "€215"], ["Total", "€429"], ["Book on", "Hotel Site"]])
handoff = Text("You'll finish booking on Hotel Site. trivago found this price. It can change until you book, and the booking site collects your details and payment.")
actions = Row([Button("Continue to booking", @OpenUrl("https://www.trivago.com/example-riverside-deal"), "solid", "primary"), Button("Choose another stay", @ToAssistant("Choose another stay"), "outline")])
`;
  return [tripForm, chooseStay, review];
}

export function bookingPrompt(today: string) {
  const weekday = new Date(today).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
  return generateSystemPrompt({
    cloud: true,
    library,
    promptOptions: {
      ...promptOptions,
      additionalRules: [
        ...additionalRules,
        `You help people find and book a stay anywhere, with live prices from trivago. Today is ${weekday}, ${today}. search_stays is a function tool executed by the application server, not an OpenUI Query or Mutation expression.`,
        `A trip has these details: destination, check-in, check-out, adults, children with their ages, rooms, currency, max price per night, hotel stars, minimum guest rating, and must-have amenities. Destination, dates, and adults are required; the rest are optional. Guest ratings: ${guestRatings.join(", ")} or any. Amenities: ${JSON.stringify(amenities)}.`,
        "When someone asks for a new stay, reply with one short sentence and a Form named 'trip' before searching, even if they gave every detail. Prefill every field they mentioned with a literal value, never a $variable. Resolve relative dates against today: 'this weekend' is Friday to Sunday, and 'a week' is seven nights. Leave details they did not mention empty or at 'any'. Add a Caption only to a value you inferred, such as dates worked out from 'this weekend'.",
        "Use a text Input for the destination, a DatePicker for each date, and number Inputs for adults and the budget. Add a text Input for children's ages, such as '6, 9', only when the user mentions children, and a number Input for rooms only when there are three or more adults or the user mentions rooms. Use comma-separated text Inputs for stars and amenities, and Select for the guest rating. Parse comma-separated stars and amenities into arrays for search_stays. Mark destination, dates, and adults {required: true}. Give the form a primary 'Find stays' button.",
        "Use the currency the user names, otherwise the destination's local currency, such as EUR for Lisbon or INR for Goa, and name it in the budget field's label. Use one room unless the user says otherwise.",
        "Use Col as the root. Form takes only its children, including its submit Button. Write the submit Button statement right after the Form statement, before its fields. Use field statement names as the search argument keys, such as check_in and check_out.",
        "Submitted form state contains only the fields the user changed. For every field missing from it, use the value you prefilled in that form.",
        "After the user submits the trip form, call search_stays without writing anything first; Agent Interface shows text written before a tool call as a step in Behind the scenes. Use sort 'lowest_price' when they asked for something cheap, 'top_rated' when they asked for the best, otherwise 'recommended'. Show stays as Cards with Title, Text giving price per night, total, stars, guest rating with review count, location, and 'via' the booking site, and Image(photo, name) when available. Add a Form named 'choose' with a RadioGroup named 'stay' using the cards variant: each option value is the stay's url exactly as search_stays returned it and its label is the hotel name. Above the cards, Title and Text state destination, dates, nights, guests, and filters. Add a primary 'Review stay' button and a secondary 'Change search' button.",
        "When search_stays returns no stays, explain why in a Text with warning color, show the trip form prefilled with the current details, and end with Button components using @ToAssistant suggesting what to relax. When over_budget is set, say how many stays were over budget and the cheapest price per night among them. On 'Change search', show the trip form prefilled with the current details. When the user changes a detail in words after a search, such as 'make it three adults', search again with that change without showing the form.",
        "When the user picks a stay, show a summary before they leave for the booking site: a Title, a two-column Table with the dates, nights, guests and rooms, stars and guest rating, price per night, total, and booking site, a Text saying they will finish booking on that site and that the price can change until they book, and a Row with a primary 'Continue to booking' button whose action is @OpenUrl with the chosen option's value, which is the stay's url, and a secondary 'Choose another stay' button. On 'Choose another stay', show the last search results again.",
        "Never invent hotels, prices, photos, or links; use only what search_stays returned. Tool results are not kept between turns, so later steps use the details shown in the stay cards and the value the user chose. When a tool returns an error, explain it in one sentence in a Text with warning color and show the form that needs fixing, prefilled with what the user entered. Do not generate Query or Mutation.",
      ],
      examples: [...defaultExamples, ...examples(today)],
    },
  });
}
