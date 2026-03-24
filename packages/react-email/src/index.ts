import type { ComponentGroup, PromptOptions } from "@openuidev/react-lang";
import { createLibrary } from "@openuidev/react-lang";

// ── Email components ──

import { EmailArticle } from "./components/Article";
import { EmailAvatar } from "./components/Avatar";
import { EmailAvatarGroup } from "./components/AvatarGroup";
import { EmailAvatarWithText } from "./components/AvatarWithText";
import { EmailBentoGrid } from "./components/BentoGrid";
import { EmailBentoItem } from "./components/BentoItem";
import { EmailButton } from "./components/Button";
import { EmailCheckoutItem } from "./components/CheckoutItem";
import { EmailCheckoutTable } from "./components/CheckoutTable";
import { EmailCodeBlock } from "./components/CodeBlock";
import { EmailCodeInline } from "./components/CodeInline";
import { EmailColumn } from "./components/Column";
import { EmailColumns } from "./components/Columns";
import { EmailCustomerReview } from "./components/CustomerReview";
import { EmailDivider } from "./components/Divider";
import { EmailFeatureGrid } from "./components/FeatureGrid";
import { EmailFeatureItem } from "./components/FeatureItem";
import { EmailFeatureList } from "./components/FeatureList";
import { EmailFooterCentered } from "./components/FooterCentered";
import { EmailFooterTwoColumn } from "./components/FooterTwoColumn";
import { EmailHeaderCenteredNav } from "./components/HeaderCenteredNav";
import { EmailHeaderSideNav } from "./components/HeaderSideNav";
import { EmailHeaderSocial } from "./components/HeaderSocial";
import { EmailHeading } from "./components/Heading";
import { EmailImage } from "./components/Image";
import { EmailImageGrid } from "./components/ImageGrid";
import { EmailLink } from "./components/Link";
import { EmailList } from "./components/List";
import { EmailListItem } from "./components/ListItem";
import { EmailMarkdown } from "./components/Markdown";
import { EmailNavLink } from "./components/NavLink";
import { EmailNumberedSteps } from "./components/NumberedSteps";
import { EmailPricingCard } from "./components/PricingCard";
import { EmailPricingFeature } from "./components/PricingFeature";
import { EmailProductCard } from "./components/ProductCard";
import { EmailSection } from "./components/Section";
import { EmailSocialIcon } from "./components/SocialIcon";
import { EmailStatItem } from "./components/StatItem";
import { EmailStats } from "./components/Stats";
import { EmailStepItem } from "./components/StepItem";
import { EmailSurveyRating } from "./components/SurveyRating";
import { EmailTemplate } from "./components/Template";
import { EmailTestimonial } from "./components/Testimonial";
import { EmailText } from "./components/Text";

// ── Component groups (email only) ──

export const emailComponentGroups: ComponentGroup[] = [
  {
    name: "Email Structure",
    components: ["EmailTemplate", "EmailSection", "EmailColumns", "EmailColumn"],
    notes: [
      "- EmailTemplate is the root email wrapper. Always use it for email content.",
      "- Use EmailSection to group related content (e.g. header area, body, footer).",
      "- Use EmailColumns + EmailColumn for multi-column layouts (e.g. two features side by side).",
    ],
  },
  {
    name: "Email Headers",
    components: [
      "EmailHeaderSideNav",
      "EmailHeaderCenteredNav",
      "EmailHeaderSocial",
      "EmailNavLink",
      "EmailSocialIcon",
    ],
    notes: [
      "- EmailHeaderSideNav: Logo on the left, text navigation links on the right. Use EmailNavLink for each link.",
      "- EmailHeaderCenteredNav: Logo centered on top, text navigation links centered below. Use EmailNavLink for each link.",
      "- EmailHeaderSocial: Logo on the left, social media icon links on the right. Use EmailSocialIcon for each icon.",
      "- Place a header as the FIRST child of EmailTemplate for a professional branded look.",
      "- Always follow the header with an EmailDivider to separate it from the body content.",
    ],
  },
  {
    name: "Email Footers",
    components: ["EmailFooterCentered", "EmailFooterTwoColumn"],
    notes: [
      "- EmailFooterCentered: Centered footer with logo, company name, tagline, social icons, address, and contact info.",
      "- EmailFooterTwoColumn: Two-column footer with logo and company info on the left, social icons and address on the right.",
      "- Both footer components accept EmailSocialIcon items for social media icons.",
      "- Place a footer as the LAST child of EmailTemplate, after an EmailDivider.",
    ],
  },
  {
    name: "Email Content",
    components: [
      "EmailHeading",
      "EmailText",
      "EmailButton",
      "EmailImage",
      "EmailDivider",
      "EmailLink",
      "EmailCodeBlock",
      "EmailCodeInline",
      "EmailMarkdown",
    ],
    notes: [
      "- EmailHeading level 1 for main title, level 2 for section headers.",
      "- EmailButton always needs an href URL.",
      "- EmailImage should use real, publicly accessible image URLs.",
      "- EmailDivider takes no arguments: EmailDivider()",
      "- EmailCodeBlock for multi-line code snippets. Optionally set language (e.g. 'javascript', 'python').",
      "- EmailCodeInline for inline code within text (e.g. variable names, commands).",
      "- EmailMarkdown for rendering markdown content (headings, bold, italic, links, lists).",
    ],
  },
  {
    name: "Email Articles & Products",
    components: ["EmailArticle", "EmailProductCard"],
    notes: [
      "- EmailArticle: Hero image + category + title + description + CTA button. Great for blog posts and newsletters.",
      "- EmailProductCard: Hero image + category + title + description + price + buy button. Great for product showcases.",
      "- Both support an optional buttonColor prop for CTA button customization.",
    ],
  },
  {
    name: "Email Features & Steps",
    components: [
      "EmailFeatureItem",
      "EmailFeatureGrid",
      "EmailFeatureList",
      "EmailStepItem",
      "EmailNumberedSteps",
    ],
    notes: [
      "- EmailFeatureItem: Child component with iconSrc, iconAlt, title, description. Used inside EmailFeatureGrid or EmailFeatureList.",
      "- EmailFeatureGrid: 2x2 grid of features with header title and description. Takes EmailFeatureItem items.",
      "- EmailFeatureList: Vertical list of features separated by dividers. Takes EmailFeatureItem items.",
      "- EmailStepItem: Child component with title and description. Used inside EmailNumberedSteps.",
      "- EmailNumberedSteps: Numbered steps list with auto-numbered badges. Takes EmailStepItem items.",
      "- For icon URLs, use https://picsum.photos/seed/KEYWORD/48/48 or similar.",
    ],
  },
  {
    name: "Email Commerce",
    components: [
      "EmailCheckoutItem",
      "EmailCheckoutTable",
      "EmailPricingFeature",
      "EmailPricingCard",
    ],
    notes: [
      "- EmailCheckoutItem: Cart item with optional image, name, quantity, price. Used inside EmailCheckoutTable.",
      "- EmailCheckoutTable: Cart table with items and checkout button. Great for abandoned cart and order summary emails.",
      "- EmailPricingFeature: Single feature line item text. Used inside EmailPricingCard.",
      "- EmailPricingCard: Pricing card with badge, price, period, description, features list, CTA button, and optional note.",
    ],
  },
  {
    name: "Email Social Proof & Surveys",
    components: ["EmailTestimonial", "EmailSurveyRating", "EmailStatItem", "EmailStats"],
    notes: [
      "- EmailTestimonial: Centered testimonial quote with avatar, name, and role.",
      "- EmailSurveyRating: Rating survey with question and 1-5 numbered buttons. Great for feedback/NPS emails.",
      "- EmailStatItem: Child component with value and label. Used inside EmailStats.",
      "- EmailStats: Horizontal row of key metrics/stats.",
    ],
  },
  {
    name: "Email Image Layouts",
    components: ["EmailImageGrid"],
    notes: [
      "- EmailImageGrid: 2x2 image grid with optional title and description. Pass up to 4 EmailImage items.",
      "- Great for product galleries, portfolios, and visual showcases.",
    ],
  },
  {
    name: "Email Avatars",
    components: ["EmailAvatar", "EmailAvatarGroup", "EmailAvatarWithText"],
    notes: [
      "- EmailAvatar: Single avatar image. Supports circular (rounded='full') or rounded-square (rounded='md') shapes, and configurable size.",
      "- EmailAvatarGroup: Overlapping stacked avatars. Pass EmailAvatar items. Great for showing team members or participants.",
      "- EmailAvatarWithText: Avatar with name and role text beside it. Optionally wraps in a link. Great for author attribution.",
    ],
  },
  {
    name: "Email Lists",
    components: ["EmailListItem", "EmailList"],
    notes: [
      "- EmailListItem: Data-only component with title and description. Used as a child inside EmailList.",
      "- EmailList: Numbered list with circular badges. Pass EmailListItem children. Great for top-N lists, how-it-works, and feature lists.",
    ],
  },
  {
    name: "Email Reviews",
    components: ["EmailCustomerReview"],
    notes: [
      "- EmailCustomerReview: Star rating distribution with bars and percentages. Shows total review count and optional CTA button.",
      "- Provide rating counts for each star level (rating1 through rating5) and totalReviews.",
    ],
  },
  {
    name: "Email Marketing",
    components: ["EmailBentoItem", "EmailBentoGrid"],
    notes: [
      "- EmailBentoItem: Data-only component with imageSrc, imageAlt, title, description. Used inside EmailBentoGrid.",
      "- EmailBentoGrid: Bento-style layout with a dark hero section on top and product cards below. Pass EmailBentoItem children.",
      "- Great for product showcase and marketing emails.",
    ],
  },
];

// ── Examples (email only, Examples 1-35) ──

export const emailExamples: string[] = [
  `Example 1 — Welcome email:
root = EmailTemplate("Welcome to Acme!", "You're in! Here's how to get started.", [heading, intro, btn, divider, footer])
heading = EmailHeading("Welcome aboard!", 1)
intro = EmailText("Thanks for signing up for Acme. We're thrilled to have you on board. Here's everything you need to get started.")
btn = EmailButton("Get Started", "https://example.com/start", "#5F51E8")
divider = EmailDivider()
footer = EmailText("If you have any questions, reply to this email. We're here to help.")`,

  `Example 2 — Newsletter with header and footer:
root = EmailTemplate("Acme Weekly", "This week: new features and tips", [header, divider1, section1, divider2, section2, divider3, footer])
header = EmailHeaderSideNav("https://picsum.photos/seed/acme-logo/150/42", "Acme", 42, [nav1, nav2, nav3])
nav1 = EmailNavLink("About", "https://example.com/about")
nav2 = EmailNavLink("Blog", "https://example.com/blog")
nav3 = EmailNavLink("Docs", "https://example.com/docs")
divider1 = EmailDivider()
section1 = EmailSection([s1title, s1text, s1btn])
s1title = EmailHeading("New Feature: Dark Mode", 2)
s1text = EmailText("We just launched dark mode across all platforms. Your eyes will thank you.")
s1btn = EmailButton("Try It Now", "https://example.com/dark-mode", "#1a1a2e")
divider2 = EmailDivider()
section2 = EmailSection([s2title, s2text])
s2title = EmailHeading("Tip of the Week", 2)
s2text = EmailText("Use keyboard shortcuts to navigate 3x faster.")
divider3 = EmailDivider()
footer = EmailFooterCentered("https://picsum.photos/seed/acme-icon/42/42", "Acme", "Acme Corporation", "Think different", "123 Main Street, Anytown, CA 12345", "hello@acme.com", [fi1, fi2, fi3])
fi1 = EmailSocialIcon("https://react.email/static/facebook-logo.png", "Facebook", "https://facebook.com/acme")
fi2 = EmailSocialIcon("https://react.email/static/x-logo.png", "X", "https://x.com/acme")
fi3 = EmailSocialIcon("https://react.email/static/instagram-logo.png", "Instagram", "https://instagram.com/acme")`,

  `Example 3 — Order confirmation with columns:
root = EmailTemplate("Order Confirmed #12345", "Your order has been placed!", [heading, thanks, divider1, cols, divider2, total, btn, divider3, footer])
heading = EmailHeading("Order Confirmed", 1)
thanks = EmailText("Thank you for your purchase! Here's a summary of your order.")
divider1 = EmailDivider()
cols = EmailColumns([col1, col2])
col1 = EmailColumn([itemTitle, itemDesc])
col2 = EmailColumn([priceTitle, priceVal])
itemTitle = EmailHeading("Item", 2)
itemDesc = EmailText("Premium Plan - Annual")
priceTitle = EmailHeading("Price", 2)
priceVal = EmailText("$99.00/year")
divider2 = EmailDivider()
total = EmailText("Total: $99.00")
btn = EmailButton("View Order", "https://example.com/orders/12345", "#16a34a")
divider3 = EmailDivider()
footer = EmailText("Need help? Contact us at support@example.com")`,

  `Example 4 — Developer onboarding with code:
root = EmailTemplate("Getting Started with Acme API", "Your API key is ready", [heading, intro, section1, divider, section2, divider2, footer])
heading = EmailHeading("Welcome to the Acme API", 1)
intro = EmailMarkdown("You're all set! Below you'll find everything you need to **get started** with our API.")
section1 = EmailSection([s1title, s1text, codeblock])
s1title = EmailHeading("Quick Start", 2)
s1text = EmailText("Install the SDK and make your first request:")
codeblock = EmailCodeBlock("npm install @acme/sdk\\n\\nimport { Acme } from '@acme/sdk';\\nconst client = new Acme({ apiKey: 'your-key' });\\nconst res = await client.ping();", "javascript")
divider = EmailDivider()
section2 = EmailSection([s2title, s2text])
s2title = EmailHeading("Need Help?", 2)
s2text = EmailMarkdown("Check our [documentation](https://docs.example.com) or reply to this email.")
divider2 = EmailDivider()
footer = EmailText("Happy coding!")`,

  `Example 5 — Password reset email:
root = EmailTemplate("Reset your password", "Someone requested a password change", [logo, heading, text1, btn, text2, divider, linkText, divider2, footer])
logo = EmailImage("https://picsum.photos/seed/app-logo/100/30", "App", 100)
heading = EmailHeading("Reset your password", 1)
text1 = EmailText("Someone recently requested a password change for your account. If this was you, click below:")
btn = EmailButton("Reset Password", "https://example.com/reset?token=abc123", "#0061fe")
text2 = EmailText("Or copy and paste this link:")
divider = EmailDivider()
linkText = EmailLink("https://example.com/reset?token=abc123", "https://example.com/reset?token=abc123")
divider2 = EmailDivider()
footer = EmailText("If you didn't request this, just ignore this email. This link expires in 24 hours.")`,

  `Example 6 — Promotional sale email:
root = EmailTemplate("Summer Sale — Up to 50% Off!", "Don't miss our biggest sale", [hero, heading, subhead, divider1, featCols, divider2, ctaBtn, divider3, footer])
hero = EmailImage("https://picsum.photos/seed/summer-sale/600/250", "Summer Sale Banner", 600)
heading = EmailHeading("Summer Sale is Here!", 1)
subhead = EmailText("For a limited time, enjoy up to 50% off on select items.")
divider1 = EmailDivider()
featCols = EmailColumns([deal1Col, deal2Col, deal3Col])
deal1Col = EmailColumn([deal1Img, deal1Name, deal1Price])
deal2Col = EmailColumn([deal2Img, deal2Name, deal2Price])
deal3Col = EmailColumn([deal3Img, deal3Name, deal3Price])
deal1Img = EmailImage("https://picsum.photos/seed/product1/180/180", "Sunglasses", 180)
deal1Name = EmailText("Designer Sunglasses")
deal1Price = EmailText("$49.99 (was $99.99)")
deal2Img = EmailImage("https://picsum.photos/seed/product2/180/180", "Beach Bag", 180)
deal2Name = EmailText("Canvas Beach Bag")
deal2Price = EmailText("$29.99 (was $59.99)")
deal3Img = EmailImage("https://picsum.photos/seed/product3/180/180", "Sandals", 180)
deal3Name = EmailText("Leather Sandals")
deal3Price = EmailText("$39.99 (was $79.99)")
divider2 = EmailDivider()
ctaBtn = EmailButton("Shop the Sale", "https://example.com/summer-sale", "#e11d48")
divider3 = EmailDivider()
footer = EmailText("StyleShop · 500 Fashion Ave · New York, NY 10018")`,

  `Example 7 — Feature showcase with grid and steps:
root = EmailTemplate("Welcome to Acme!", "Discover what you can do", [heading, intro, divider1, featureGrid, divider2, steps, divider3, footer])
heading = EmailHeading("Welcome to Acme!", 1)
intro = EmailText("Here's what you can do with your new account:")
divider1 = EmailDivider()
featureGrid = EmailFeatureGrid("Key Features", "Powerful features to help you succeed.", [feat1, feat2, feat3, feat4])
feat1 = EmailFeatureItem("https://picsum.photos/seed/heart/48/48", "Heart", "Easy to Use", "Get started in minutes.")
feat2 = EmailFeatureItem("https://picsum.photos/seed/rocket/48/48", "Rocket", "Lightning Fast", "Blazing fast performance.")
feat3 = EmailFeatureItem("https://picsum.photos/seed/shield/48/48", "Shield", "Secure", "Enterprise-grade security.")
feat4 = EmailFeatureItem("https://picsum.photos/seed/chart/48/48", "Chart", "Analytics", "Deep data insights.")
divider2 = EmailDivider()
steps = EmailNumberedSteps("Getting Started", "Follow these steps:", [step1, step2, step3])
step1 = EmailStepItem("Create Profile", "Set up your profile with a photo and bio.")
step2 = EmailStepItem("Connect Tools", "Integrate with Slack, GitHub, and Jira.")
step3 = EmailStepItem("Invite Team", "Add team members and start collaborating.")
divider3 = EmailDivider()
footer = EmailText("Acme, Inc. · San Francisco, CA 94107")`,

  `Example 8 — Abandoned cart email:
root = EmailTemplate("You left something behind!", "Complete your purchase", [heading, text, checkout, divider, footer])
heading = EmailHeading("Don't forget your items!", 1)
text = EmailText("Complete your purchase before these items sell out.")
checkout = EmailCheckoutTable("Your Cart", [item1, item2], "Complete Purchase", "https://example.com/checkout", "#4F46E5")
item1 = EmailCheckoutItem("https://picsum.photos/seed/watch/100/100", "Classic Watch", "Classic Watch", 1, "$210.00")
item2 = EmailCheckoutItem("https://picsum.photos/seed/clock/100/100", "Wall Clock", "Analogue Clock", 2, "$40.00")
divider = EmailDivider()
footer = EmailText("Acme Store · 123 Commerce Way · San Francisco, CA 94107")`,

  `Example 9 — Pricing with testimonial and survey:
root = EmailTemplate("Upgrade to Pro", "Unlock premium features", [heading, text, divider1, pricing, divider2, testimonial, divider3, survey, divider4, footer])
heading = EmailHeading("Upgrade Your Plan", 1)
text = EmailText("You've been on the free plan for 30 days. Unlock everything with Pro.")
divider1 = EmailDivider()
pricing = EmailPricingCard("Pro", "$12", "/ month", "Everything you need to grow.", [pf1, pf2, pf3], "Upgrade Now", "https://example.com/upgrade", "#4F46E5")
pf1 = EmailPricingFeature("Unlimited projects")
pf2 = EmailPricingFeature("Advanced analytics")
pf3 = EmailPricingFeature("Priority support")
divider2 = EmailDivider()
testimonial = EmailTestimonial("Acme Pro transformed our workflow. Can't imagine going back.", "https://picsum.photos/seed/ceo/100/100", "Jane Smith", "Jane Smith", "CEO, TechCorp")
divider3 = EmailDivider()
survey = EmailSurveyRating("How would you rate your experience?", "Your feedback helps us improve.", "#4F46E5")
divider4 = EmailDivider()
footer = EmailText("Acme, Inc. · San Francisco, CA 94107")`,

  `Example 10 — Stats, gallery, avatars, list, and bento grid:
root = EmailTemplate("Your Monthly Report", "Key metrics and highlights", [header, divider1, stats, divider2, gallery, divider3, team, divider4, list, divider5, bento, divider6, reviews, divider7, footer])
header = EmailHeaderCenteredNav("https://picsum.photos/seed/acme/150/42", "Acme", 42, [nav1, nav2])
nav1 = EmailNavLink("Dashboard", "https://example.com/dashboard")
nav2 = EmailNavLink("Reports", "https://example.com/reports")
divider1 = EmailDivider()
stats = EmailStats([stat1, stat2, stat3])
stat1 = EmailStatItem("12,847", "Users")
stat2 = EmailStatItem("94.2%", "Uptime")
stat3 = EmailStatItem("$48.5K", "Revenue")
divider2 = EmailDivider()
gallery = EmailImageGrid("New Products", "Our latest arrivals.", [img1, img2, img3, img4])
img1 = EmailImage("https://picsum.photos/seed/prod-a/300/288", "Product A")
img2 = EmailImage("https://picsum.photos/seed/prod-b/300/288", "Product B")
img3 = EmailImage("https://picsum.photos/seed/prod-c/300/288", "Product C")
img4 = EmailImage("https://picsum.photos/seed/prod-d/300/288", "Product D")
divider3 = EmailDivider()
team = EmailAvatarGroup([av1, av2, av3])
av1 = EmailAvatar("https://picsum.photos/seed/person1/100/100", "Alice", 44)
av2 = EmailAvatar("https://picsum.photos/seed/person2/100/100", "Bob", 44)
av3 = EmailAvatar("https://picsum.photos/seed/person3/100/100", "Carol", 44)
divider4 = EmailDivider()
list = EmailList("Top 3 Updates", [li1, li2, li3])
li1 = EmailListItem("New Dashboard", "Redesigned analytics dashboard with real-time data.")
li2 = EmailListItem("Mobile App", "Now available on iOS and Android.")
li3 = EmailListItem("API v2", "Faster, more reliable API with new endpoints.")
divider5 = EmailDivider()
bento = EmailBentoGrid("Featured Collection", "Handpicked products for you.", "Shop now", "https://example.com/shop", "https://picsum.photos/seed/hero/400/250", "Collection", [bi1, bi2])
bi1 = EmailBentoItem("https://picsum.photos/seed/item-x/300/200", "Item X", "Premium Widget", "High-quality craftsmanship.")
bi2 = EmailBentoItem("https://picsum.photos/seed/item-y/300/200", "Item Y", "Deluxe Gadget", "Next-gen technology.")
divider6 = EmailDivider()
reviews = EmailCustomerReview("Product Ratings", 500, 300, 100, 50, 30, 20, "Write a Review", "https://example.com/review", "#4F46E5")
divider7 = EmailDivider()
footer = EmailFooterTwoColumn("https://picsum.photos/seed/acme-icon/42/42", "Acme", "Acme Corp", "Innovation first", "123 Main St, CA 12345", "hello@acme.com", [si1, si2])
si1 = EmailSocialIcon("https://react.email/static/x-logo.png", "X", "https://x.com/acme")
si2 = EmailSocialIcon("https://react.email/static/instagram-logo.png", "Instagram", "https://instagram.com/acme")`,
];

// ── Additional rules (email only) ──

export const emailAdditionalRules: string[] = [
  "You are an expert email designer using react-email components.",
  "The 10 supported email types are: Welcome/Onboarding, Newsletter, Order Confirmation, Password Reset, Promotional/Sale, Event Invitation, Feedback Request, Shipping/Delivery Update, Account Verification, Onboarding Tutorial.",
  "Use realistic, professional placeholder text — never use lorem ipsum.",
  "Always provide both subject and previewText for EmailTemplate.",
  "Use EmailSection to group related content areas (header, body, footer sections).",
  "Use EmailDivider between major sections for visual separation.",
  "For multi-column layouts (features, pricing comparisons), use EmailColumns with EmailColumn children.",
  "Keep email designs clean and focused — avoid too many colors or fonts.",
  "Use EmailButton with descriptive labels and realistic href URLs.",
  "For images, use publicly accessible URLs like https://picsum.photos/seed/KEYWORD/600/300.",
  "When the user asks to modify an existing email, regenerate the full EmailTemplate with the requested changes applied.",
  "Use EmailCodeBlock for multi-line code (API examples, install commands). Set the language prop for syntax context.",
  "Use EmailCodeInline for short inline code references within EmailText (e.g. variable names, CLI commands).",
  "Use EmailMarkdown when the content includes rich formatting like bold, italic, links, or lists — it's more flexible than plain EmailText.",
  "Use EmailHeaderSideNav for a professional header with logo left and nav links right.",
  "Use EmailHeaderCenteredNav for a centered brand header with logo on top and nav links below.",
  "Use EmailHeaderSocial for a header with logo left and social media icons right.",
  "Place the header as the FIRST child of EmailTemplate, followed by an EmailDivider.",
  "Use EmailFooterCentered for a centered footer with logo, company name, social icons, and contact info.",
  "Use EmailFooterTwoColumn for a two-column footer with logo and info on the left, social icons and address on the right.",
  "Place the footer as the LAST child of EmailTemplate, after an EmailDivider.",
  "Use EmailArticle for blog post or newsletter article blocks with hero image, category, title, description, and CTA.",
  "Use EmailProductCard for product showcases with image, title, description, price, and buy button.",
  "Use EmailFeatureGrid for a 2x2 grid of features with icons. Provide exactly 4 EmailFeatureItem children.",
  "Use EmailFeatureList for a vertical list of features with icons and dividers. Any number of EmailFeatureItem children.",
  "Use EmailNumberedSteps for step-by-step guides. Steps are auto-numbered. Provide EmailStepItem children.",
  "Use EmailCheckoutTable for cart/order summary tables. Provide EmailCheckoutItem children with product details.",
  "Use EmailPricingCard for pricing plans with feature lists. Provide EmailPricingFeature children for each feature line.",
  "Use EmailTestimonial for customer quotes with avatar, name, and role.",
  "Use EmailSurveyRating for feedback/NPS emails with a 1-5 rating scale.",
  "Use EmailStats for displaying key metrics. Provide EmailStatItem children with value and label.",
  "Use EmailImageGrid for a 2x2 image gallery. Provide up to 4 EmailImage children.",
  "Use EmailAvatar for a single avatar image. Set rounded='full' for circular or rounded='md' for rounded-square. Default size is 42px.",
  "Use EmailAvatarGroup for overlapping stacked avatars. Provide EmailAvatar children. Great for showing team members or participants.",
  "Use EmailAvatarWithText for an avatar with name and role text. Optionally wrap in a link with href. Great for author attribution in articles.",
  "Use EmailList for numbered lists with circular badges. Provide EmailListItem children with title and description.",
  "Use EmailCustomerReview for a star rating distribution summary. Provide counts for each rating level (rating1-rating5) and totalReviews.",
  "Use EmailBentoGrid for a bento-style marketing layout. Provide a dark hero section and EmailBentoItem children for product cards below.",
];

// ── Prompt options (email only) ──

export const emailPromptOptions: PromptOptions = {
  examples: emailExamples,
  additionalRules: emailAdditionalRules,
};

// ── Ready-to-use library ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const emailLibrary = createLibrary({
  root: "EmailTemplate",
  componentGroups: emailComponentGroups,
  components: [
    EmailTemplate,
    EmailSection,
    EmailColumns,
    EmailColumn,
    EmailHeaderSideNav,
    EmailHeaderCenteredNav,
    EmailHeaderSocial,
    EmailNavLink,
    EmailSocialIcon,
    EmailFooterCentered,
    EmailFooterTwoColumn,
    EmailHeading,
    EmailText,
    EmailButton,
    EmailImage,
    EmailDivider,
    EmailLink,
    EmailCodeBlock,
    EmailCodeInline,
    EmailMarkdown,
    EmailArticle,
    EmailProductCard,
    EmailFeatureItem,
    EmailFeatureGrid,
    EmailFeatureList,
    EmailStepItem,
    EmailNumberedSteps,
    EmailCheckoutItem,
    EmailCheckoutTable,
    EmailPricingFeature,
    EmailPricingCard,
    EmailTestimonial,
    EmailSurveyRating,
    EmailStatItem,
    EmailStats,
    EmailImageGrid,
    EmailAvatar,
    EmailAvatarGroup,
    EmailAvatarWithText,
    EmailListItem,
    EmailList,
    EmailCustomerReview,
    EmailBentoItem,
    EmailBentoGrid,
  ] as any[],
});
