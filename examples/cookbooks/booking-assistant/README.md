# Booking assistant

A runnable companion to the [booking assistant cookbook](https://www.openui.com/cookbooks/booking-assistant). Describe a trip in your own words, get a form prefilled with what the assistant understood, fill in what's missing, pick from stays that are actually open for your dates, and confirm a booking after reviewing its summary.

The example books stays in **Lisbon** from real [Inside Airbnb](https://insideairbnb.com/get-the-data/) listings and their nightly availability calendar. Bookings are simulated: they are saved in a local database, and nothing is charged or sent to a host. It runs on Next.js, Agent Interface, OpenUI Gateway, and Node's built-in SQLite module.

## Run

Requirements: Node.js 22.13+ and npm. This is a standalone example outside the package workspace.

```bash
npm ci
```

Configure `THESYS_API_KEY` from the [Thesys Console](https://console.thesys.dev/keys) privately in `.env.local`. Optional `OPENUI_MODEL` selects a supported `provider/model` identifier; the default is `openai/gpt-5.5`.

```bash
npm run prepare:listings
npm run dev
```

`prepare:listings` downloads Inside Airbnb's latest Lisbon snapshot, about 36 MB, into `data/`, and takes about half a minute. Open http://localhost:3000. To use another port, run `npm run dev -- --port 3001`.

Try:

- “Book a place in Lisbon for two this weekend.” The form arrives with the dates and guests filled in.
- “Find me a cheap private room for a solo trip next month, under €70 a night, with wifi.” “Next month” is too vague to guess, so the dates stay empty and required.
- After a search, “Actually make it under €25 a night, in Alfama.” The assistant searches again, explains why nothing matches, and suggests what to relax.

## How it works

1. Agent Interface sends the latest user message to `/api/chat`.
2. For a new request, OpenUI Gateway replies with a form prefilled with every detail the model understood, with validation rules on the required fields.
3. When the user submits the form, Agent Interface sends the button label and the form's values as the next message, and the model calls `search_stays`.
4. The server checks each listing's calendar for every night of the stay, applies the user's preferences, and returns the best matches. When few stays match, it also counts how many each relaxed preference would add.
5. The model shows the stays as selectable cards, then a summary and a guest details form. `book_stay` runs only after the user confirms, checks availability again, and saves the booking.

## Files

| File                              | Purpose                                                                |
| --------------------------------- | ---------------------------------------------------------------------- |
| `scripts/prepare-listings.ts`     | Download the Lisbon snapshot, filter listings, and store availability  |
| `src/lib/stays.ts`                | Neighbourhoods, amenities, database schema, booking window, and checks |
| `src/lib/tools/search-stays.ts`   | Function schema, argument validation, and availability search          |
| `src/lib/tools/book-stay.ts`      | Function schema, argument validation, and the simulated booking        |
| `src/library.ts`                  | Shared components for the prompt and renderer                          |
| `src/components/date-picker.tsx`  | A DatePicker that the model can prefill with YYYY-MM-DD dates          |
| `src/lib/prompt.ts`               | Booking rules and one example for each step of the flow                |
| `src/app/api/chat/route.ts`       | Request validation, Gateway generation, and SSE response               |
| `src/app/api/bookings/route.ts`   | Bookings for the My bookings page                                      |
| `src/lib/tool-loop.ts`            | The Gateway template's function-tool loop                              |
| `src/lib/gateway-session.ts`      | Local identity, frontend tokens, conversation ownership, stopped tools |
| `src/lib/theme.ts`                | Light and dark theme overrides                                         |
| `src/components/booking-chat.tsx` | Agent Interface, custom sidebar, My bookings route, and starters       |
| `src/components/my-bookings.tsx`  | The My bookings page                                                   |

`npm run generate` creates the ignored component specification before dev/build/verify. The server passes that specification to `generateSystemPrompt({ cloud: true, library: spec, promptOptions })`, and Agent Interface renders responses with the same component library.

## Listings

`prepare:listings` finds the latest Lisbon snapshot on Inside Airbnb's download page and downloads `listings.csv.gz` and `calendar.csv.gz`. It keeps well-reviewed listings in the city of Lisbon, at least 20 reviews and a rating of 4.7 or more, which leaves about 5,700. For each one, it stores the nightly calendar as a string with one character per night, so checking a stay is a substring test. Re-running it downloads a newer snapshot when one exists and rebuilds `data/stays.sqlite`, which also clears bookings.

Availability and prices are as of the snapshot date. Prices are in euros per night, from Inside Airbnb's price quote for each listing. The data is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the downloads and database are ignored by Git and are not redistributed with this repository.

## Forms

The model prefills fields with literal values. Submitted form state contains only the fields the user changed, so the prompt tells the model to use its prefilled value for any field missing from the state.

React UI's `DatePicker` stores `Date` objects, which a model cannot write and which reach the model as UTC timestamps. `src/components/date-picker.tsx` keeps the same name and props but reads and writes `YYYY-MM-DD` strings, so a prefilled date shows in the picker and a submitted date is the calendar day the user picked.

## Gateway conversations

Generation uses `conversation: threadId` and `store: true`, so the client sends only the latest user message and continuations submit only new function outputs. A submitted form arrives as one message with the form's values, so the chat route accepts messages of up to 4,000 characters. `useOpenuiCloudStorage` loads the sidebar and messages using short-lived tokens from `/api/frontend-token`. `DEMO_USER_ID` defaults to `local-demo` and `APP_ID` to `booking-assistant-cookbook`; keep them stable to retain history.

Stopping a response while a tool runs can leave a stored function call without its output, which Gateway rejects on the next turn. The chat route sends a "stopped" output for any such call ahead of the next message.

The app binds to loopback and its routes reject production requests. For deployment, replace the local guard with authentication and rate limits, derive user identity from the session, retain conversation ownership checks, keep the API key on the server, and connect `book_stay` to a real booking system with its own confirmation step.

## Verify

```bash
npm run verify
```

`verify` generates the component specification and runs a production build with type checking. It needs neither credentials nor a download.

In the browser, submit a form with a required field cleared to see validation, expand **Behind the scenes** to inspect `search_stays` and `book_stay`, open **My bookings** in the sidebar after confirming, and switch the operating system between light and dark mode.
