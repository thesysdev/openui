/**
 * Entry point for the OpenUI CLI spec generator.
 *
 * `pnpm generate` runs `openui generate src/library.ts --spec`, which bundles
 * this file (stubbing asset imports) and reads the `library` + `promptOptions`
 * exports to write `src/generated/spec.json`.
 */
import { openuiPromptOptions } from "@openuidev/react-ui/genui-lib";

export { openuiLibrary as library } from "@openuidev/react-ui/genui-lib";

/**
 * The library's prompt options plus two form rules. Without them, a request
 * like "when I submit, show a summary" gets a pre-written summary revealed
 * locally, so the user's entries never reach the assistant, and fields that
 * should appear for a certain answer are never wired up.
 */
export const promptOptions = {
  ...openuiPromptOptions,
  additionalRules: [
    ...(openuiPromptOptions.additionalRules ?? []),
    'A Form\'s submit button must send the entries to you: its action must be @ToAssistant(...), e.g. Button("Plan my trip", @ToAssistant("Plan my trip"), "primary"), never @Set or another local-only action. Don\'t put what the form produces (a summary, plan or itinerary) in the same reply, hidden or not; write it in your next reply from the values the user submitted.',
    'When a field should only appear for a certain answer (e.g. a company name only for Business trips), bind the deciding field to a $variable with its value argument, e.g. RadioGroup("tripType", items, "Leisure", { required: true }, $tripType), and show the field with $tripType == "Business" ? companyField : null.',
  ],
};
