import {
  BedDouble,
  Building2,
  CalendarDays,
  Landmark,
  Martini,
  Mountain,
  Sun,
  TramFront,
  TreePalm,
  UtensilsCrossed,
  Waves,
  Wine,
} from "lucide-react";
import type { ComparisonExample } from "../types";

/* Forms: "Help me plan my next vacation" (from the cloud demo's starters).
   Plain text asks a list of questions; OpenUI asks with a form. */
export const TRIP_FORM: ComparisonExample = {
  prompt: "Help me plan my next vacation",
  left: {
    label: "Without",
    follow: true,
    blocks: [
      { type: "heading", text: "Let's Plan Your Vacation" },
      {
        type: "paragraph",
        text: "I'd be happy to help you plan your next vacation! To give you the best recommendations, I'll need a few details first. Could you answer the following questions?",
      },
      {
        type: "bullets",
        items: [
          "Where would you like to go? Do you have a specific destination in mind, or should I suggest some options?",
          "When are you planning to travel, and for how many days?",
          "How many people will be travelling, and will there be any children?",
          "What is your approximate budget per person, including flights and accommodation?",
          "What kind of experiences are you interested in — for example beaches, food, culture, adventure, nightlife or relaxation?",
          "Do you have any preferences for accommodation, such as hotels, resorts, or rentals?",
        ],
      },
      {
        type: "paragraph",
        text: "Once you reply with these details, I'll put together a suggested itinerary with places to stay, things to do and an estimated budget for your trip.",
      },
    ],
  },
  right: {
    label: "With OpenUI",
    blocks: [
      { type: "heading", text: "Plan your next vacation" },
      { type: "muted", text: "Tell me a little about the trip and I'll build the itinerary." },
      {
        type: "form",
        submit: "Plan my trip",
        secondary: "Save for later",
        fields: [
          { kind: "section", label: "Trip" },
          {
            kind: "tags",
            label: "Destinations",
            tags: [
              {
                label: "Lisbon",
                swatch: "linear-gradient(135deg, #7dd3fc, #2563eb)",
                icon: <TramFront aria-hidden />,
              },
              {
                label: "Porto",
                swatch: "linear-gradient(135deg, #c4b5fd, #7c3aed)",
                icon: <Wine aria-hidden />,
              },
            ],
            placeholder: "Add a city…",
          },
          {
            kind: "row",
            fields: [
              {
                kind: "text",
                label: "Check-in",
                value: "Tue, May 12",
                icon: <CalendarDays aria-hidden />,
              },
              {
                kind: "text",
                label: "Check-out",
                value: "Mon, May 18",
                icon: <CalendarDays aria-hidden />,
              },
            ],
          },
          {
            kind: "row",
            fields: [
              { kind: "stepper", label: "Adults", value: 2 },
              { kind: "stepper", label: "Children", value: 0 },
            ],
          },
          { kind: "section", label: "Preferences" },
          {
            kind: "row",
            columns: "minmax(0, 1fr) auto",
            wrap: true,
            divided: true,
            fields: [
              {
                kind: "chips",
                label: "Interests",
                options: [
                  { label: "Food", icon: <UtensilsCrossed aria-hidden /> },
                  { label: "Culture", icon: <Landmark aria-hidden /> },
                  { label: "Beaches", icon: <Waves aria-hidden /> },
                  { label: "Nightlife", icon: <Martini aria-hidden /> },
                  { label: "Hiking", icon: <Mountain aria-hidden /> },
                  { label: "Relaxing", icon: <Sun aria-hidden /> },
                ],
                selected: ["Food", "Culture"],
                columns: 3,
              },
              {
                kind: "tiles",
                label: "Stay",
                options: [
                  { label: "Boutique hotel", icon: <BedDouble aria-hidden /> },
                  { label: "Apartment", icon: <Building2 aria-hidden /> },
                  { label: "Resort", icon: <TreePalm aria-hidden /> },
                ],
                selected: ["Boutique hotel", "Apartment"],
              },
            ],
          },
          { kind: "section", label: "Budget" },
          {
            kind: "range",
            label: "Budget per person",
            info: true,
            value: "$1,000 – $2,500",
            from: 0.2,
            to: 0.5,
            min: "$0",
            max: "$5,000+",
          },
        ],
      },
    ],
  },
};
