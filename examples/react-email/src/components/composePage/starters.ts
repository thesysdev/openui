export const STARTERS = [
  {
    icon: "\uD83D\uDE80",
    iconBg: "#1a1a3e",
    displayText: "OpenUI launch announcement",
    prompt: `Create a beautiful launch announcement email for OpenUI — the open standard for Generative UI. OpenUI lets AI respond with real UI components instead of plain text. Use teal (#50D4E2) as the accent color. Make it developer-focused, polished, and comprehensive.

Include these sections in order:

1. EmailHeaderCenteredNav with logo (https://www.openui.com/favicon.svg, "OpenUI", height 42) and 3 nav links: "Documentation", "GitHub", "Examples"
2. EmailDivider
3. EmailImage hero banner (https://www.openui.com/meta-image.png, "OpenUI — The Open Standard for Generative UI", 600)
4. EmailHeading "The Open Standard for Generative UI" (level 1)
5. EmailText "Stop building chat UIs that only return plain text. OpenUI lets your AI respond with real, interactive components — forms, charts, cards, tables, and more. Define your components once, and any LLM can render them."
6. EmailButton "Get Started — npx @openuidev/cli create" linking to https://www.openui.com with color #50D4E2
7. EmailDivider
8. EmailHeading "Why developers choose OpenUI" (level 2)
9. EmailText "OpenUI is up to 3x faster rendering than JSON-based approaches, uses up to 67% fewer tokens, and works with any LLM provider."
10. EmailDivider
11. EmailStats with 3 items: ("3x", "Faster Rendering"), ("67%", "Fewer Tokens"), ("0", "Arbitrary Code Execution")
12. EmailDivider
13. EmailFeatureGrid titled "Built for the modern AI stack" with description "Everything you need to ship generative UI experiences." and 4 items:
    - (https://react.dev/favicon-32x32.png, "React", "React Components", "40+ production-ready components with defineComponent and Zod-powered type safety.")
    - (https://openai.com/favicon.ico, "AI", "Any LLM Provider", "OpenAI, Anthropic, Gemini, Mistral — works with any OpenAI-compatible API.")
    - (https://www.typescriptlang.org/favicon-32x32.png, "TypeScript", "OpenUI Lang", "A specialized format that LLMs generate natively — no JSON parsing, no prompt hacks.")
    - (https://vercel.com/favicon.ico, "Deploy", "Chat SDK Included", "Drop-in Copilot, FullScreen, and BottomTray layouts with streaming and persistence.")
14. EmailDivider
15. EmailCodeBlock with this code:
    "import { defineComponent } from '@openuidev/react-lang';\\nimport { z } from 'zod';\\n\\nexport const WeatherCard = defineComponent({\\n  name: 'WeatherCard',\\n  props: z.object({\\n    city: z.string(),\\n    temp: z.number(),\\n    condition: z.string(),\\n  }),\\n  description: 'Shows current weather for a city',\\n  component: ({ props }) => (\\n    <div>\\n      <h3>{props.city}</h3>\\n      <p>{props.temp}° — {props.condition}</p>\\n    </div>\\n  ),\\n});"
    with language "typescript"
16. EmailDivider
17. EmailFeatureList titled "How OpenUI works" with description "From component definition to rendered UI in 4 steps." and 3 items:
    - (https://www.openui.com/favicon.svg, "Define", "Define your components", "Register components with defineComponent and Zod schemas. OpenUI generates the system prompt automatically.")
    - (https://www.openui.com/favicon.svg, "Generate", "LLM generates OpenUI Lang", "The AI responds in a lightweight, token-efficient format purpose-built for UI generation.")
    - (https://www.openui.com/favicon.svg, "Render", "Render in real-time", "The Renderer parses and displays components with streaming support — no flash of empty content.")
18. EmailDivider
19. EmailList titled "Get started in 3 steps" with 3 items:
    - "Scaffold your project" / "Run npx @openuidev/cli create to set up a new project with React, TypeScript, and your choice of LLM provider."
    - "Define your component library" / "Use defineComponent with Zod schemas. Group them with createLibrary. OpenUI handles the system prompt."
    - "Connect and ship" / "Point to any OpenAI-compatible API. Drop in a Chat layout or use the headless useChat hook. Deploy anywhere."
20. EmailDivider
21. EmailPricingCard with badge "OPEN SOURCE", price "$0", period "/ forever", description "OpenUI is fully open source under MIT license. No vendor lock-in, no usage limits, no enterprise gates.", features: "Unlimited components & libraries", "All LLM providers supported", "Commercial use — MIT license", "Community support on GitHub & Discord", button "Star on GitHub" with href https://github.com/thesysdev/openui and color #50D4E2
22. EmailTestimonial with quote "OpenUI completely changed how we build AI features. We went from fragile JSON parsing to a type-safe component system in a weekend. The token savings alone made it worth switching.", avatar (https://picsum.photos/seed/dev-testimonial/100/100, "Alex Rivera"), name "Alex Rivera", role "Staff Engineer at Vercel"
24. EmailDivider
25. EmailCustomerReview titled "Loved by developers" with totalReviews 2800, rating5: 2240, rating4: 392, rating3: 112, rating2: 28, rating1: 28, button "Leave a Review", href https://github.com/thesysdev/openui, color #50D4E2
27. EmailSurveyRating with question "How was your experience with OpenUI?" and description "Your feedback helps us build a better developer tool." and color #50D4E2
31. EmailDivider
32. EmailFooterCentered with logo (https://www.openui.com/favicon.svg, "OpenUI"), company "OpenUI", tagline "The open standard for Generative UI", address "Built by Thesys · San Francisco, CA", contact "hello@openui.com", and 3 social icons:
    - (https://react.email/static/facebook-logo.png, "Facebook", https://facebook.com/openui)
    - (https://react.email/static/x-logo.png, "X", https://x.com/thesaboratorio)
    - (https://react.email/static/instagram-logo.png, "Instagram", https://instagram.com/openui)`,
  },
  {
    icon: "\uD83D\uDED2",
    iconBg: "#2e1a1e",
    displayText: "Abandoned cart reminder",
    prompt: `Create a beautiful abandoned cart email for a premium e-commerce brand called "Lumière". Use warm gold (#D4A574) as the accent color. Make it elegant, product-focused, and persuasive.

Include these sections in order:

1. EmailHeaderSideNav with logo (https://picsum.photos/seed/lumiere-logo/150/42, "Lumière", height 42) and 3 nav links: "New Arrivals", "Bestsellers", "Sale"
2. EmailDivider
3. EmailHeading "You left something beautiful behind" (level 1)
4. EmailText "Hi there — your cart is waiting. These handcrafted pieces won't be available forever. Complete your order before they're gone."
5. EmailDivider
6. EmailCheckoutTable titled "Your Cart" with 3 items and button "Complete Your Order" with href https://lumiere.com/cart and color #D4A574:
   - (https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=100&h=100&fit=crop, "Gold Watch", "Artisan Gold Watch", 1, "$420.00")
   - (https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop, "Leather Bag", "Italian Leather Tote", 1, "$285.00")
   - (https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=100&h=100&fit=crop, "Silk Scarf", "Hand-painted Silk Scarf", 2, "$95.00")
7. EmailDivider
8. EmailProductCard with image (https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=320&fit=crop, "Artisan Gold Watch"), category "BESTSELLER", title "Artisan Gold Watch", description "Hand-assembled in our Geneva atelier. Swiss movement, sapphire crystal, and a 5-year warranty. Each piece is numbered and unique.", price "$420.00", button "Shop Now", href https://lumiere.com/products/gold-watch, color #D4A574
9. EmailDivider
10. EmailImageGrid titled "You might also love" with description "Curated picks based on your style." and 4 images:
    - (https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&h=288&fit=crop, "Gold Bracelet")
    - (https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=288&fit=crop, "Signature Perfume")
    - (https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=288&fit=crop, "Designer Sunglasses")
    - (https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&h=288&fit=crop, "Pearl Earrings")
11. EmailDivider
12. EmailTestimonial with quote "The craftsmanship is exceptional. I've received more compliments on my Lumière watch than anything I've ever owned. Worth every penny.", avatar (https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop, "Emma Laurent"), name "Emma Laurent", role "Verified Buyer · Paris"
13. EmailDivider
14. EmailButton "Complete Your Order — Free Shipping" linking to https://lumiere.com/cart with color #D4A574
15. EmailDivider
16. EmailFooterCentered with logo (https://picsum.photos/seed/lumiere-icon/42/42, "Lumière"), company "Lumière", tagline "Crafted with intention", address "Lumière · 12 Rue du Faubourg Saint-Honoré · Paris, 75008", contact "hello@lumiere.com", and 3 social icons:
    - (https://react.email/static/facebook-logo.png, "Facebook", https://facebook.com/lumiere)
    - (https://react.email/static/x-logo.png, "X", https://x.com/lumiere)
    - (https://react.email/static/instagram-logo.png, "Instagram", https://instagram.com/lumiere)`,
  },
  {
    icon: "\uD83C\uDF9F\uFE0F",
    iconBg: "#1a2e1e",
    displayText: "Tech conference invitation",
    prompt: `Create an exciting tech conference invitation email for "DevSummit 2026" — a 2-day developer conference. Use electric purple (#7C3AED) as the accent color. Make it bold, energetic, and information-rich.

Include these sections in order:

1. EmailHeaderCenteredNav with logo (https://picsum.photos/seed/devsummit-logo/150/42, "DevSummit 2026", height 42) and 3 nav links: "Speakers", "Schedule", "Tickets"
2. EmailDivider
3. EmailImage hero (https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=300&fit=crop, "DevSummit 2026 — March 15-16, San Francisco", 600)
4. EmailHeading "DevSummit 2026 — You're Invited" (level 1)
5. EmailText "Join 3,000+ developers, founders, and tech leaders for two days of talks, workshops, and networking at the Moscone Center in San Francisco. Early bird pricing ends soon."
6. EmailButton "Get Your Ticket" linking to https://devsummit.dev/tickets with color #7C3AED
7. EmailDivider
8. EmailStats with 3 items: ("50+", "Speakers"), ("3,000+", "Attendees"), ("2", "Days")
9. EmailDivider
10. EmailFeatureGrid titled "What to Expect" with description "Two days packed with insights, hands-on workshops, and connections." and 4 items:
    - (https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=48&h=48&fit=crop, "Keynotes", "World-Class Keynotes", "Hear from engineering leaders at Vercel, Stripe, Linear, and more.")
    - (https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=48&h=48&fit=crop, "Workshops", "Hands-on Workshops", "Build real projects with AI, React Server Components, and edge computing.")
    - (https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=48&h=48&fit=crop, "Networking", "Networking Events", "Evening mixers, 1:1 mentoring sessions, and the legendary after-party.")
    - (https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=48&h=48&fit=crop, "Expo", "Startup Expo", "Meet 40+ startups showcasing cutting-edge developer tools.")
11. EmailDivider
12. EmailList titled "Featured Speakers" with 3 items:
    - "Sarah Drasner" / "VP of Developer Experience at Netlify. Keynote on the future of web development and AI-assisted coding."
    - "Guillermo Rauch" / "CEO of Vercel. Talk on the evolution of React and what's next for the framework ecosystem."
    - "Lea Verou" / "W3C TAG member. Workshop on modern CSS techniques that will change how you build interfaces."
13. EmailDivider
14. EmailPricingCard with badge "EARLY BIRD", price "$299", period "/ person", description "Full access to all talks, workshops, networking events, meals, and the after-party. Group discounts available for teams of 5+.", features: "All keynotes & sessions", "Hands-on workshop access", "Networking mixer + after-party", "Lunch & refreshments both days", button "Claim Early Bird Price" with href https://devsummit.dev/tickets and color #7C3AED
15. EmailDivider
16. EmailSurveyRating with question "Interested in attending?" and description "Rate your interest and we'll send you updates." and color #7C3AED
17. EmailDivider
18. EmailFooterCentered with logo (https://picsum.photos/seed/devsummit-icon/42/42, "DevSummit"), company "DevSummit", tagline "Where developers connect", address "Moscone Center · 747 Howard St · San Francisco, CA 94103", contact "hello@devsummit.dev", and 3 social icons:
    - (https://react.email/static/facebook-logo.png, "Facebook", https://facebook.com/devsummit)
    - (https://react.email/static/x-logo.png, "X", https://x.com/devsummit)
    - (https://react.email/static/instagram-logo.png, "Instagram", https://instagram.com/devsummit)`,
  },
  {
    icon: "\u2708\uFE0F",
    iconBg: "#2e1a1a",
    displayText: "Travel marketplace newsletter",
    prompt: `Create a warm, beautiful travel marketplace newsletter email for an Airbnb-like platform called "Wanderly". Use coral (#FF5A5F) as the accent color. Make it image-rich, friendly, and inspiring.

Include these sections in order:

1. EmailHeaderCenteredNav with logo (https://picsum.photos/seed/wanderly-logo/150/42, "Wanderly", height 42) and 3 nav links: "Explore", "Stays", "Experiences"
2. EmailDivider
3. EmailHeading "Your Week in Travel" (level 1)
4. EmailText "Handpicked destinations, trending stays, and exclusive deals — curated just for you. Here's what's inspiring travelers this week."
5. EmailDivider
6. EmailImageGrid titled "Trending Destinations" with description "The most-booked places by Wanderly travelers this month." and 4 images:
   - (https://picsum.photos/seed/santorini-blue/300/288, "Santorini, Greece")
   - (https://picsum.photos/seed/kyoto-temple/300/288, "Kyoto, Japan")
   - (https://picsum.photos/seed/maldives-ocean/300/288, "Maldives")
   - (https://picsum.photos/seed/swiss-alps-snow/300/288, "Swiss Alps")
7. EmailDivider
8. EmailArticle with image (https://picsum.photos/seed/ocean-villa-sunset/600/320, "Ocean Villa at Sunset"), category "FEATURED STAY", title "Cliffside Ocean Villa in Santorini", description "Wake up to panoramic views of the Aegean Sea from your private infinity pool. This stunning 3-bedroom villa features hand-carved stone interiors, a sun-drenched terrace, and direct access to a secluded beach.", button "Book Now — $285/night", href https://wanderly.com/stays/santorini-villa, color #FF5A5F
9. EmailDivider
10. EmailList titled "Top 3 Picks This Week" with 3 items:
    - "Amalfi Coast, Italy" / "Lemon groves, pastel villages, and the best pasta you'll ever eat. Prices drop 20% in shoulder season."
    - "Bali Rice Terraces" / "Ubud's emerald rice paddies are peak magic right now. Book a treehouse stay for the full experience."
    - "Northern Lights, Iceland" / "Aurora season peaks this month. Glass-roof cabins are selling out — don't wait."
11. EmailDivider
12. EmailStats with 3 items: ("2M+", "Stays Booked"), ("190", "Countries"), ("4.8★", "Avg Rating")
16. EmailDivider
17. EmailSurveyRating with question "How was your last trip?" and description "Your feedback helps us find better stays for you." and color #FF5A5F
18. EmailDivider
19. EmailTestimonial with quote "Wanderly found us a hidden gem in Tuscany that wasn't on any other platform. The host left homemade limoncello and a handwritten welcome note. Absolute magic.", avatar (https://picsum.photos/seed/guest-james/100/100, "James Mitchell"), name "James Mitchell", role "Verified Guest · Tuscany 2025"
20. EmailDivider
21. EmailFooterCentered with logo (https://picsum.photos/seed/wanderly-icon/42/42, "Wanderly"), company "Wanderly", tagline "Find your next adventure", address "Wanderly Inc · 888 Brannan St · San Francisco, CA 94103", contact "hello@wanderly.com", and 3 social icons:
    - (https://react.email/static/facebook-logo.png, "Facebook", https://facebook.com/wanderly)
    - (https://react.email/static/x-logo.png, "X", https://x.com/wanderly)
    - (https://react.email/static/instagram-logo.png, "Instagram", https://instagram.com/wanderly)`,
  },
];
