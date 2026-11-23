/**
 * Entry point for the OpenUI CLI spec generator.
 *
 * `pnpm generate` runs `openui generate src/library.tsx --spec`, which bundles
 * this file (stubbing asset imports) and reads the `library` + `promptOptions`
 * exports to write `src/generated/spec.json`.
 */
import {
  additionalRules,
  promptOptions as intelligentPromptOptions,
} from "@openuidev/intelligent-ui-library";

export { library } from "@openuidev/intelligent-ui-library";

/**
 * The library's prompt options plus two form rules. Without them, a request
 * like "when I submit, show a summary" gets a pre-written summary revealed
 * locally, so the user's entries never reach the assistant, and fields that
 * should appear for a certain answer are never wired up.
 */
export const promptOptions = {
  ...intelligentPromptOptions,
  additionalRules: [
    ...additionalRules,
    'A Form\'s submit button must send the entries to you: its action must be @ToAssistant(...), e.g. Button("Plan my trip", @ToAssistant("Plan my trip"), "solid", "primary"), never @Set or another local-only action. Don\'t put what the form produces (a summary, plan or itinerary) in the same reply, hidden or not; write it in your next reply from the values the user submitted.',
    'When a field should only appear for a certain answer (e.g. a company name only for Business trips), bind the deciding field to a $variable with its first value argument. Initialize $tripType = "Leisure", use RadioGroup($tripType, ["Leisure", "Business"], "Trip type", "pills", { required: true }), and show the field with $tripType == "Business" ? companyField : null.',
  ],
};
