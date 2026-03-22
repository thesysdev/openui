import type { ComponentGroup, PromptOptions } from "@openuidev/react-lang";

// ── Email components ──

export { EmailArticle } from "./components/EmailArticle";
export { EmailAvatar } from "./components/EmailAvatar";
export { EmailAvatarGroup } from "./components/EmailAvatarGroup";
export { EmailAvatarWithText } from "./components/EmailAvatarWithText";
export { EmailBentoGrid } from "./components/EmailBentoGrid";
export { EmailBentoItem } from "./components/EmailBentoItem";
export { EmailButton } from "./components/EmailButton";
export { EmailCheckoutItem } from "./components/EmailCheckoutItem";
export { EmailCheckoutTable } from "./components/EmailCheckoutTable";
export { EmailCodeBlock } from "./components/EmailCodeBlock";
export { EmailCodeInline } from "./components/EmailCodeInline";
export { EmailColumn } from "./components/EmailColumn";
export { EmailColumns } from "./components/EmailColumns";
export { EmailCustomerReview } from "./components/EmailCustomerReview";
export { EmailDivider } from "./components/EmailDivider";
export { EmailFeatureGrid } from "./components/EmailFeatureGrid";
export { EmailFeatureItem } from "./components/EmailFeatureItem";
export { EmailFeatureList } from "./components/EmailFeatureList";
export { EmailFooterCentered } from "./components/EmailFooterCentered";
export { EmailFooterTwoColumn } from "./components/EmailFooterTwoColumn";
export { EmailHeaderCenteredNav } from "./components/EmailHeaderCenteredNav";
export { EmailHeaderSideNav } from "./components/EmailHeaderSideNav";
export { EmailHeaderSocial } from "./components/EmailHeaderSocial";
export { EmailHeading } from "./components/EmailHeading";
export { EmailImage } from "./components/EmailImage";
export { EmailImageGrid } from "./components/EmailImageGrid";
export { EmailLink } from "./components/EmailLink";
export { EmailList } from "./components/EmailList";
export { EmailListItem } from "./components/EmailListItem";
export { EmailMarkdown } from "./components/EmailMarkdown";
export { EmailNavLink } from "./components/EmailNavLink";
export { EmailNumberedSteps } from "./components/EmailNumberedSteps";
export { EmailPricingCard } from "./components/EmailPricingCard";
export { EmailPricingFeature } from "./components/EmailPricingFeature";
export { EmailProductCard } from "./components/EmailProductCard";
export { EmailSection } from "./components/EmailSection";
export { EmailSocialIcon } from "./components/EmailSocialIcon";
export { EmailStatItem } from "./components/EmailStatItem";
export { EmailStats } from "./components/EmailStats";
export { EmailStepItem } from "./components/EmailStepItem";
export { EmailSurveyRating } from "./components/EmailSurveyRating";
export { EmailTemplate } from "./components/EmailTemplate";
export { EmailTestimonial } from "./components/EmailTestimonial";
export { EmailText } from "./components/EmailText";

// ── Unions ──

export { EmailLeafChildUnion } from "./unions";

// ── Component groups ──

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

// ── Examples ──

export const emailExamples: string[] = [
  `Example 1 — Welcome email:
root = Card([email, followups])
email = EmailTemplate("Welcome to Acme!", "You're in! Here's how to get started.", [heading, intro, btn, divider, footer])
heading = EmailHeading("Welcome aboard!", 1)
intro = EmailText("Thanks for signing up for Acme. We're thrilled to have you on board. Here's everything you need to get started.")
btn = EmailButton("Get Started", "https://example.com/start", "#5F51E8")
divider = EmailDivider()
footer = EmailText("If you have any questions, reply to this email. We're here to help.")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Make the tone more casual")
f2 = FollowUpItem("Add a product features section")`,

  `Example 2 — Newsletter with sections:
root = Card([email, followups])
email = EmailTemplate("Acme Weekly - Issue #12", "This week: new features, tips, and community highlights", [header, divider1, section1, divider2, section2, divider3, footerText])
header = EmailHeading("Acme Weekly", 1)
divider1 = EmailDivider()
section1 = EmailSection([s1title, s1text, s1btn])
s1title = EmailHeading("New Feature: Dark Mode", 2)
s1text = EmailText("We just launched dark mode across all platforms. Your eyes will thank you.")
s1btn = EmailButton("Try It Now", "https://example.com/dark-mode", "#1a1a2e")
divider2 = EmailDivider()
section2 = EmailSection([s2title, s2text])
s2title = EmailHeading("Tip of the Week", 2)
s2text = EmailText("Use keyboard shortcuts to navigate 3x faster. Press ? anywhere to see the full list.")
divider3 = EmailDivider()
footerText = EmailText("You're receiving this because you subscribed to Acme Weekly.")
followups = FollowUpBlock([f1, f2, f3])
f1 = FollowUpItem("Add an image hero banner")
f2 = FollowUpItem("Include a third section about community")
f3 = FollowUpItem("Change the color scheme to blue")`,

  `Example 3 — Order confirmation with columns:
root = Card([email, followups])
email = EmailTemplate("Order Confirmed #12345", "Your order has been placed!", [heading, thanks, divider1, cols, divider2, total, btn, divider3, footer])
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
footer = EmailText("Need help? Contact us at support@example.com")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add more order items")
f2 = FollowUpItem("Include shipping details")`,

  `Example 4 — Developer onboarding with code:
root = Card([email, followups])
email = EmailTemplate("Getting Started with Acme API", "Your API key is ready — here's how to make your first call", [heading, intro, section1, divider, section2, divider2, footer])
heading = EmailHeading("Welcome to the Acme API", 1)
intro = EmailMarkdown("You're all set! Below you'll find everything you need to **get started** with our API.")
section1 = EmailSection([s1title, s1text, codeblock])
s1title = EmailHeading("Quick Start", 2)
s1text = EmailText("Install the SDK and make your first request:")
codeblock = EmailCodeBlock("npm install @acme/sdk\n\nimport { Acme } from '@acme/sdk';\nconst client = new Acme({ apiKey: 'your-key' });\nconst res = await client.ping();", "javascript")
divider = EmailDivider()
section2 = EmailSection([s2title, s2text])
s2title = EmailHeading("Need Help?", 2)
s2text = EmailMarkdown("Check our [documentation](https://docs.example.com) or reply to this email.")
divider2 = EmailDivider()
footer = EmailText("Happy coding!")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add a Python example instead")
f2 = FollowUpItem("Include authentication details")`,

  `Example 5 — Stripe-style welcome email:
root = Card([email, followups])
email = EmailTemplate("Welcome to Stripe!", "You're now ready to make live transactions with Stripe!", [logo, divider1, intro, dashboardText, btn, divider2, docsText, apiText, checklistText, signoff, divider3, footerAddr])
logo = EmailImage("https://picsum.photos/seed/stripe-logo/150/40", "Stripe", 150)
divider1 = EmailDivider()
intro = EmailText("Thanks for submitting your account information. You're now ready to make live transactions with Stripe!")
dashboardText = EmailText("You can view your payments and a variety of other information about your account right from your dashboard.")
btn = EmailButton("View your Stripe Dashboard", "https://dashboard.stripe.com/login", "#656ee8")
divider2 = EmailDivider()
docsText = EmailMarkdown("If you haven't finished your integration, you might find our [docs](https://docs.stripe.com) handy.")
apiText = EmailMarkdown("Once you're ready to start accepting payments, you'll just need to use your live [API keys](https://dashboard.stripe.com/apikeys) instead of your test API keys.")
checklistText = EmailMarkdown("Finally, we've put together a [quick checklist](https://docs.stripe.com/get-started/checklist) to ensure your website conforms to card network standards.")
signoff = EmailText("— The Stripe team")
divider3 = EmailDivider()
footerAddr = EmailText("Stripe, 354 Oyster Point Blvd, South San Francisco, CA 94080")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add a getting started checklist")
f2 = FollowUpItem("Make the tone more personal")`,

  `Example 6 — Password reset email:
root = Card([email, followups])
email = EmailTemplate("Reset your password", "Someone recently requested a password change for your account", [logo, heading, text1, text2, btn, text3, signoff, divider, footer])
logo = EmailImage("https://picsum.photos/seed/dropbox-logo/100/30", "Dropbox", 100)
heading = EmailHeading("Reset your password", 1)
text1 = EmailText("Someone recently requested a password change for your Dropbox account. If this was you, you can set a new password here:")
text2 = EmailText("This link will expire in 24 hours.")
btn = EmailButton("Reset Password", "https://example.com/reset?token=abc123", "#0061fe")
text3 = EmailText("If you don't want to change your password or didn't request this, just ignore and delete this message.")
signoff = EmailText("— The Dropbox Team")
divider = EmailDivider()
footer = EmailText("Dropbox, Inc. · P.O. Box 77767 · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add a security warning section")
f2 = FollowUpItem("Include account activity details")`,

  `Example 7 — Team invitation email:
root = Card([email, followups])
email = EmailTemplate("Join the team on Vercel", "You've been invited to join a team on Vercel", [logo, divider1, greeting, inviteText, btn, divider2, securityNote, divider3, footer])
logo = EmailImage("https://picsum.photos/seed/vercel-logo/100/30", "Vercel", 100)
divider1 = EmailDivider()
greeting = EmailHeading("Join the team on Vercel", 1)
inviteText = EmailText("Sarah (sarah@company.com) has invited you to join the Frontend Engineering team on Vercel. Start deploying your projects with zero configuration.")
btn = EmailButton("Join the Team", "https://vercel.com/teams/invite/abc123", "#000000")
divider2 = EmailDivider()
securityNote = EmailText("If you were not expecting this invitation, you can ignore this email. If you are concerned about your account's safety, please reply to this email to get in touch with us.")
divider3 = EmailDivider()
footer = EmailText("Vercel, Inc. · 440 N Barranca Ave · Covina, CA 91723")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add team member avatars")
f2 = FollowUpItem("Include project details")`,

  `Example 8 — Purchase receipt with columns:
root = Card([email, followups])
email = EmailTemplate("Your Apple Receipt", "Apple Receipt for your recent purchase", [headerCols, divider1, infoSection, divider2, itemSection, divider3, totalSection, divider4, footer])
headerCols = EmailColumns([logoCol, receiptCol])
logoCol = EmailColumn([logo])
receiptCol = EmailColumn([receiptTitle])
logo = EmailImage("https://picsum.photos/seed/apple-logo/42/42", "Apple", 42)
receiptTitle = EmailHeading("Receipt", 2)
divider1 = EmailDivider()
infoSection = EmailSection([appleIdLabel, dateLabel, orderLabel])
appleIdLabel = EmailText("APPLE ID: alan.turing@gmail.com")
dateLabel = EmailText("INVOICE DATE: 18 Jan 2023")
orderLabel = EmailText("ORDER ID: ML4F5L8522")
divider2 = EmailDivider()
itemSection = EmailSection([itemCols])
itemCols = EmailColumns([itemNameCol, itemPriceCol])
itemNameCol = EmailColumn([itemName])
itemPriceCol = EmailColumn([itemPrice])
itemName = EmailText("iCloud+ 50GB")
itemPrice = EmailText("$0.99")
divider3 = EmailDivider()
totalSection = EmailSection([totalRow])
totalRow = EmailColumns([totalLabelCol, totalValueCol])
totalLabelCol = EmailColumn([totalLabel])
totalValueCol = EmailColumn([totalValue])
totalLabel = EmailHeading("TOTAL", 2)
totalValue = EmailText("$0.99")
divider4 = EmailDivider()
footer = EmailText("Apple Inc. · One Apple Park Way · Cupertino, CA 95014")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add more line items")
f2 = FollowUpItem("Include billing address")`,

  `Example 9 — Login code email:
root = Card([email, followups])
email = EmailTemplate("Your login code for Linear", "Your login code is 123456", [logo, heading, text1, codeDisplay, text2, divider, footer])
logo = EmailImage("https://picsum.photos/seed/linear-logo/42/42", "Linear", 42)
heading = EmailHeading("Your login code", 1)
text1 = EmailText("Enter this code to complete your login. This code will expire in 10 minutes.")
codeDisplay = EmailHeading("123456", 1)
text2 = EmailText("If you didn't request this code, you can safely ignore this email.")
divider = EmailDivider()
footer = EmailText("Linear · San Francisco, CA")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Change to a magic link button instead")
f2 = FollowUpItem("Add device/location info")`,

  `Example 10 — Review request email:
root = Card([email, followups])
email = EmailTemplate("How was your stay?", "Leave a review for your recent stay", [logo, heading, greeting, stayInfo, reviewText, btn, divider, footer])
logo = EmailImage("https://picsum.photos/seed/airbnb-logo/100/30", "Airbnb", 100)
heading = EmailHeading("How was your stay?", 1)
greeting = EmailText("Hi Alan,")
stayInfo = EmailText("We hope you enjoyed your stay at the Oceanfront Villa in Malibu. Your review helps other guests make informed decisions and helps hosts improve their listings.")
reviewText = EmailText("Take a moment to share your experience — it only takes a minute!")
btn = EmailButton("Leave a Review", "https://airbnb.com/review/abc123", "#FF5A5F")
divider = EmailDivider()
footer = EmailText("Airbnb, Inc. · 888 Brannan St · San Francisco, CA 94103")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add a star rating display")
f2 = FollowUpItem("Include property photo")`,

  `Example 11 — Shipping update email:
root = Card([email, followups])
email = EmailTemplate("Your order has shipped!", "Your package is on its way", [logo, heading, greeting, shipText, trackingSection, divider1, itemsSection, divider2, footer])
logo = EmailImage("https://picsum.photos/seed/shop-logo/120/35", "ShopExpress", 120)
heading = EmailHeading("Your order has shipped!", 1)
greeting = EmailText("Hi Sarah,")
shipText = EmailText("Great news! Your order #ORD-2024-8891 has been shipped and is on its way to you.")
trackingSection = EmailSection([trackTitle, trackNum, trackBtn])
trackTitle = EmailHeading("Tracking Information", 2)
trackNum = EmailText("Tracking Number: 1Z999AA10123456784")
trackBtn = EmailButton("Track Package", "https://example.com/track/1Z999AA10123456784", "#2563eb")
divider1 = EmailDivider()
itemsSection = EmailSection([itemsTitle, itemCols])
itemsTitle = EmailHeading("Items Shipped", 2)
itemCols = EmailColumns([nameCol, qtyCol])
nameCol = EmailColumn([itemName1, itemName2])
qtyCol = EmailColumn([qty1, qty2])
itemName1 = EmailText("Wireless Headphones")
itemName2 = EmailText("Phone Case")
qty1 = EmailText("Qty: 1")
qty2 = EmailText("Qty: 2")
divider2 = EmailDivider()
footer = EmailText("ShopExpress · 100 Commerce Way · Austin, TX 78701")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add estimated delivery date")
f2 = FollowUpItem("Include return policy info")`,

  `Example 12 — Account verification email:
root = Card([email, followups])
email = EmailTemplate("Verify your email address", "Please verify your email to activate your account", [logo, heading, text1, btn, text2, linkText, divider, footer])
logo = EmailImage("https://picsum.photos/seed/plaid-logo/100/30", "Plaid", 100)
heading = EmailHeading("Verify your identity", 1)
text1 = EmailText("We need to verify your email address to complete your account setup. Click the button below to confirm your email.")
btn = EmailButton("Verify Email", "https://example.com/verify?token=xyz789", "#635bff")
text2 = EmailText("Or copy and paste this link into your browser:")
linkText = EmailLink("https://example.com/verify?token=xyz789", "https://example.com/verify?token=xyz789")
divider = EmailDivider()
footer = EmailText("This verification link will expire in 48 hours. If you did not create an account, please disregard this email.")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add security tips section")
f2 = FollowUpItem("Include what happens after verification")`,

  `Example 13 — Promotional sale email:
root = Card([email, followups])
email = EmailTemplate("Summer Sale — Up to 50% Off!", "Don't miss our biggest sale of the year", [hero, heading, subhead, divider1, featuredSection, divider2, ctaSection, divider3, footer])
hero = EmailImage("https://picsum.photos/seed/summer-sale/600/250", "Summer Sale Banner", 600)
heading = EmailHeading("Summer Sale is Here!", 1)
subhead = EmailText("For a limited time, enjoy up to 50% off on select items. Shop our curated collection of summer essentials.")
divider1 = EmailDivider()
featuredSection = EmailSection([featTitle, featCols])
featTitle = EmailHeading("Featured Deals", 2)
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
ctaSection = EmailSection([ctaText, ctaBtn])
ctaText = EmailText("Sale ends July 31st. Don't miss out!")
ctaBtn = EmailButton("Shop the Sale", "https://example.com/summer-sale", "#e11d48")
divider3 = EmailDivider()
footer = EmailText("StyleShop · 500 Fashion Ave · New York, NY 10018 · Unsubscribe")
followups = FollowUpBlock([f1, f2, f3])
f1 = FollowUpItem("Add a countdown timer section")
f2 = FollowUpItem("Change to a holiday theme")
f3 = FollowUpItem("Add customer testimonials")`,

  `Example 14 — Event invitation email:
root = Card([email, followups])
email = EmailTemplate("You're Invited: Tech Summit 2024", "Join us for an exclusive tech event", [logo, heading, greeting, eventDetails, divider1, speakersSection, divider2, ctaSection, divider3, footer])
logo = EmailImage("https://picsum.photos/seed/event-logo/150/50", "Tech Summit", 150)
heading = EmailHeading("You're Invited!", 1)
greeting = EmailText("Hi there,")
eventDetails = EmailSection([eventTitle, dateText, locationText, descText])
eventTitle = EmailHeading("Tech Summit 2024", 2)
dateText = EmailText("Date: September 15-17, 2024")
locationText = EmailText("Location: Moscone Center, San Francisco, CA")
descText = EmailText("Join 5,000+ developers, designers, and tech leaders for three days of inspiring talks, workshops, and networking.")
divider1 = EmailDivider()
speakersSection = EmailSection([speakersTitle, speakersCols])
speakersTitle = EmailHeading("Featured Speakers", 2)
speakersCols = EmailColumns([sp1Col, sp2Col])
sp1Col = EmailColumn([sp1Img, sp1Name, sp1Role])
sp2Col = EmailColumn([sp2Img, sp2Name, sp2Role])
sp1Img = EmailImage("https://picsum.photos/seed/speaker1/120/120", "Speaker 1", 120)
sp1Name = EmailText("Dr. Jane Smith")
sp1Role = EmailText("CTO, TechCorp")
sp2Img = EmailImage("https://picsum.photos/seed/speaker2/120/120", "Speaker 2", 120)
sp2Name = EmailText("Alex Rivera")
sp2Role = EmailText("VP Engineering, DataFlow")
divider2 = EmailDivider()
ctaSection = EmailSection([earlyText, rsvpBtn])
earlyText = EmailText("Early bird pricing ends August 1st. Reserve your spot today!")
rsvpBtn = EmailButton("RSVP Now", "https://example.com/techsummit/register", "#7c3aed")
divider3 = EmailDivider()
footer = EmailText("Tech Events Inc. · 100 Conference Way · San Francisco, CA 94105")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add an agenda/schedule section")
f2 = FollowUpItem("Include virtual attendance option")`,

  `Example 15 — Feedback request email:
root = Card([email, followups])
email = EmailTemplate("How are we doing?", "We'd love to hear your feedback", [logo, heading, greeting, text1, text2, btn, divider, altText, divider2, footer])
logo = EmailImage("https://picsum.photos/seed/feedback-logo/120/35", "Acme", 120)
heading = EmailHeading("We value your feedback", 1)
greeting = EmailText("Hi Alex,")
text1 = EmailText("You've been using Acme for 30 days now, and we'd love to hear how things are going. Your feedback helps us improve the product for everyone.")
text2 = EmailText("It takes less than 2 minutes — we promise!")
btn = EmailButton("Share Your Feedback", "https://example.com/feedback/survey123", "#059669")
divider = EmailDivider()
altText = EmailMarkdown("Alternatively, just reply to this email with your thoughts. We read every response.")
divider2 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add NPS rating scale")
f2 = FollowUpItem("Include specific feature questions")`,

  `Example 16 — Newsletter with side navigation header:
root = Card([email, followups])
email = EmailTemplate("Acme Weekly - Issue #15", "This week: product updates and tips", [header, divider1, heading, intro, divider2, section1, divider3, footerText])
header = EmailHeaderSideNav("https://picsum.photos/seed/acme-logo/150/42", "Acme", 42, [nav1, nav2, nav3])
nav1 = EmailNavLink("About", "https://example.com/about")
nav2 = EmailNavLink("Blog", "https://example.com/blog")
nav3 = EmailNavLink("Docs", "https://example.com/docs")
divider1 = EmailDivider()
heading = EmailHeading("What's new this week", 1)
intro = EmailText("Here's your weekly roundup of product updates, tips, and community highlights.")
divider2 = EmailDivider()
section1 = EmailSection([s1title, s1text, s1btn])
s1title = EmailHeading("New: Team Collaboration", 2)
s1text = EmailText("Invite team members and collaborate in real-time on shared projects.")
s1btn = EmailButton("Learn More", "https://example.com/collaboration", "#5F51E8")
divider3 = EmailDivider()
footerText = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add a centered header instead")
f2 = FollowUpItem("Include more content sections")`,

  `Example 17 — Welcome email with centered navigation header:
root = Card([email, followups])
email = EmailTemplate("Welcome to Acme!", "Get started with your new account", [header, divider1, heading, intro, btn, divider2, footer])
header = EmailHeaderCenteredNav("https://picsum.photos/seed/acme-centered/150/42", "Acme", 42, [nav1, nav2, nav3, nav4])
nav1 = EmailNavLink("About", "https://example.com/about")
nav2 = EmailNavLink("Blog", "https://example.com/blog")
nav3 = EmailNavLink("Company", "https://example.com/company")
nav4 = EmailNavLink("Features", "https://example.com/features")
divider1 = EmailDivider()
heading = EmailHeading("Welcome aboard!", 1)
intro = EmailText("Thanks for joining Acme. We're excited to have you on board. Here's how to get started.")
btn = EmailButton("Get Started", "https://example.com/start", "#5F51E8")
divider2 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add social icons header instead")
f2 = FollowUpItem("Add a features section below")`,

  `Example 18 — Welcome email with centered footer:
root = Card([email, followups])
email = EmailTemplate("Welcome to Acme!", "Get started with your new account", [header, divider1, heading, intro, btn, divider2, footer])
header = EmailHeaderSideNav("https://picsum.photos/seed/acme-logo/150/42", "Acme", 42, [nav1, nav2, nav3])
nav1 = EmailNavLink("About", "https://example.com/about")
nav2 = EmailNavLink("Blog", "https://example.com/blog")
nav3 = EmailNavLink("Docs", "https://example.com/docs")
divider1 = EmailDivider()
heading = EmailHeading("Welcome aboard!", 1)
intro = EmailText("Thanks for joining Acme. We're excited to have you on board.")
btn = EmailButton("Get Started", "https://example.com/start", "#5F51E8")
divider2 = EmailDivider()
footer = EmailFooterCentered("https://picsum.photos/seed/acme-icon/42/42", "Acme", "Acme Corporation", "Think different", "123 Main Street, Anytown, CA 12345", "hello@acme.com · +1 (555) 123-4567", [fi1, fi2, fi3])
fi1 = EmailSocialIcon("https://react.email/static/facebook-logo.png", "Facebook", "https://facebook.com/acme")
fi2 = EmailSocialIcon("https://react.email/static/x-logo.png", "X", "https://x.com/acme")
fi3 = EmailSocialIcon("https://react.email/static/instagram-logo.png", "Instagram", "https://instagram.com/acme")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Use a two-column footer instead")
f2 = FollowUpItem("Add more content sections")`,

  `Example 19 — Newsletter with two-column footer:
root = Card([email, followups])
email = EmailTemplate("Acme Weekly - Issue #20", "Product updates and tips", [header, divider1, heading, intro, divider2, section1, divider3, footer])
header = EmailHeaderCenteredNav("https://picsum.photos/seed/acme-centered/150/42", "Acme", 42, [nav1, nav2, nav3])
nav1 = EmailNavLink("About", "https://example.com/about")
nav2 = EmailNavLink("Blog", "https://example.com/blog")
nav3 = EmailNavLink("Docs", "https://example.com/docs")
divider1 = EmailDivider()
heading = EmailHeading("What's new this week", 1)
intro = EmailText("Here's your weekly roundup of product updates and tips.")
divider2 = EmailDivider()
section1 = EmailSection([s1title, s1text, s1btn])
s1title = EmailHeading("New Feature: Analytics Dashboard", 2)
s1text = EmailText("Track your key metrics with our new real-time analytics dashboard.")
s1btn = EmailButton("Try It Now", "https://example.com/analytics", "#5F51E8")
divider3 = EmailDivider()
footer = EmailFooterTwoColumn("https://picsum.photos/seed/acme-icon/42/42", "Acme", "Acme Corporation", "Think different", "123 Main Street, Anytown, CA 12345", "hello@acme.com · +1 (555) 123-4567", [fi1, fi2, fi3])
fi1 = EmailSocialIcon("https://react.email/static/facebook-logo.png", "Facebook", "https://facebook.com/acme")
fi2 = EmailSocialIcon("https://react.email/static/x-logo.png", "X", "https://x.com/acme")
fi3 = EmailSocialIcon("https://react.email/static/instagram-logo.png", "Instagram", "https://instagram.com/acme")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Use a centered footer instead")
f2 = FollowUpItem("Add a promotional section")`,

  `Example 20 — Announcement with social icons header:
root = Card([email, followups])
email = EmailTemplate("Big Announcement from Acme", "We have exciting news to share", [header, divider1, heading, text1, text2, btn, divider2, footer])
header = EmailHeaderSocial("https://picsum.photos/seed/acme-social/42/42", "Acme", 42, [icon1, icon2, icon3])
icon1 = EmailSocialIcon("https://react.email/static/x-logo.png", "X", "https://x.com/acme")
icon2 = EmailSocialIcon("https://react.email/static/instagram-logo.png", "Instagram", "https://instagram.com/acme")
icon3 = EmailSocialIcon("https://react.email/static/facebook-logo.png", "Facebook", "https://facebook.com/acme")
divider1 = EmailDivider()
heading = EmailHeading("Introducing Acme Pro", 1)
text1 = EmailText("We're thrilled to announce Acme Pro — our most powerful plan yet with advanced analytics, priority support, and unlimited integrations.")
text2 = EmailText("Early adopters get 30% off for the first year.")
btn = EmailButton("Upgrade to Pro", "https://example.com/pro", "#7c3aed")
divider2 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Use a side navigation header instead")
f2 = FollowUpItem("Add pricing details section")`,

  `Example 21 — Newsletter with article block:
root = Card([email, followups])
email = EmailTemplate("Acme Blog: New Post", "Designing with Furniture — our latest article", [header, divider1, article, divider2, footer])
header = EmailHeaderSideNav("https://picsum.photos/seed/acme-logo/150/42", "Acme", 42, [nav1, nav2])
nav1 = EmailNavLink("Blog", "https://example.com/blog")
nav2 = EmailNavLink("About", "https://example.com/about")
divider1 = EmailDivider()
article = EmailArticle("https://picsum.photos/seed/furniture/600/320", "Furniture design", "Design", "Designing with Furniture", "Unleash your inner designer as we explore how furniture plays a vital role in creating stunning interiors.", "Read more", "https://example.com/blog/furniture-design", "#4F46E5")
divider2 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add a second article below")
f2 = FollowUpItem("Change to a product showcase instead")`,

  `Example 22 — Product launch email:
root = Card([email, followups])
email = EmailTemplate("New: Acme Pro Watch", "Introducing our latest timepiece", [header, divider1, product, divider2, footer])
header = EmailHeaderSideNav("https://picsum.photos/seed/acme-logo/150/42", "Acme", 42, [nav1, nav2])
nav1 = EmailNavLink("Shop", "https://example.com/shop")
nav2 = EmailNavLink("About", "https://example.com/about")
divider1 = EmailDivider()
product = EmailProductCard("https://picsum.photos/seed/watch/600/320", "Pro Watch", "New Arrival", "Acme Pro Watch", "Precision engineering meets timeless design. Our most advanced timepiece yet.", "$299.00", "Shop Now", "https://example.com/shop/pro-watch", "#4F46E5")
divider2 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add customer testimonials")
f2 = FollowUpItem("Include a feature comparison")`,

  `Example 23 — Onboarding email with feature grid:
root = Card([email, followups])
email = EmailTemplate("Welcome to Acme!", "Discover what you can do", [heading, intro, divider, featureGrid, divider2, footer])
heading = EmailHeading("Welcome to Acme!", 1)
intro = EmailText("Here's what you can do with your new account:")
divider = EmailDivider()
featureGrid = EmailFeatureGrid("Everything you need", "Powerful features to help you succeed.", [feat1, feat2, feat3, feat4])
feat1 = EmailFeatureItem("https://picsum.photos/seed/heart-icon/48/48", "Heart", "Easy to Use", "Get started in minutes with our intuitive interface.")
feat2 = EmailFeatureItem("https://picsum.photos/seed/rocket-icon/48/48", "Rocket", "Lightning Fast", "Blazing fast performance for all your workflows.")
feat3 = EmailFeatureItem("https://picsum.photos/seed/shield-icon/48/48", "Shield", "Secure by Default", "Enterprise-grade security built into every layer.")
feat4 = EmailFeatureItem("https://picsum.photos/seed/chart-icon/48/48", "Chart", "Advanced Analytics", "Deep insights to make data-driven decisions.")
divider2 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Use a vertical feature list instead")
f2 = FollowUpItem("Add a CTA button at the bottom")`,

  `Example 24 — Feature list email:
root = Card([email, followups])
email = EmailTemplate("What's New at Acme", "New features this month", [heading, divider, featureList, divider2, footer])
heading = EmailHeading("What's New", 1)
divider = EmailDivider()
featureList = EmailFeatureList("This Month's Updates", "We've been busy building features you'll love.", [feat1, feat2, feat3])
feat1 = EmailFeatureItem("https://picsum.photos/seed/heart-icon/48/48", "Heart", "Versatile Comfort", "Experience ultimate comfort and versatility with our new dashboard layout.")
feat2 = EmailFeatureItem("https://picsum.photos/seed/rocket-icon/48/48", "Rocket", "Faster Performance", "We've optimized load times by 3x across the board.")
feat3 = EmailFeatureItem("https://picsum.photos/seed/shield-icon/48/48", "Shield", "Enhanced Security", "New two-factor authentication options for your account.")
divider2 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Use a 2x2 feature grid instead")
f2 = FollowUpItem("Add numbered steps")`,

  `Example 25 — Getting started with numbered steps:
root = Card([email, followups])
email = EmailTemplate("Get Started with Acme", "4 simple steps to get going", [heading, intro, divider, steps, divider2, btn, divider3, footer])
heading = EmailHeading("Getting Started", 1)
intro = EmailText("Follow these simple steps to set up your account:")
divider = EmailDivider()
steps = EmailNumberedSteps("Your Setup Guide", "Complete these steps to unlock all features.", [step1, step2, step3, step4])
step1 = EmailStepItem("Create Your Profile", "Set up your profile with a photo and bio to personalize your experience.")
step2 = EmailStepItem("Connect Your Tools", "Integrate with your favorite apps like Slack, GitHub, and Jira.")
step3 = EmailStepItem("Invite Your Team", "Add team members and set permissions for collaboration.")
step4 = EmailStepItem("Start Building", "Create your first project and explore all features.")
divider2 = EmailDivider()
btn = EmailButton("Go to Dashboard", "https://example.com/dashboard", "#4F46E5")
divider3 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add images to each step")
f2 = FollowUpItem("Reduce to 3 steps")`,

  `Example 26 — Abandoned cart email:
root = Card([email, followups])
email = EmailTemplate("You left something behind!", "Complete your purchase", [heading, text, checkout, divider, footer])
heading = EmailHeading("Don't forget your items!", 1)
text = EmailText("You're so close! Complete your purchase before these items sell out.")
checkout = EmailCheckoutTable("Your Cart", [item1, item2], "Complete Purchase", "https://example.com/checkout", "#4F46E5")
item1 = EmailCheckoutItem("https://picsum.photos/seed/watch/100/100", "Classic Watch", "Classic Watch", 1, "$210.00")
item2 = EmailCheckoutItem("https://picsum.photos/seed/clock/100/100", "Wall Clock", "Analogue Clock", 2, "$40.00")
divider = EmailDivider()
footer = EmailText("Acme Store · 123 Commerce Way · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add a discount code section")
f2 = FollowUpItem("Include related products")`,

  `Example 27 — Pricing upgrade email:
root = Card([email, followups])
email = EmailTemplate("Upgrade to Pro", "Unlock premium features at a special price", [heading, text, divider, pricing, divider2, footer])
heading = EmailHeading("Upgrade Your Plan", 1)
text = EmailText("You've been on the free plan for 30 days. Unlock everything with Pro.")
divider = EmailDivider()
pricing = EmailPricingCard("Special Offer", "$12", "/ month", "Everything you need to grow your business.", [pf1, pf2, pf3, pf4, pf5], "Claim Your Offer", "https://example.com/upgrade", "#4F46E5", "Limited time offer — save 20% today")
pf1 = EmailPricingFeature("Manage up to 25 premium products")
pf2 = EmailPricingFeature("Up to 10,000 subscribers")
pf3 = EmailPricingFeature("Advanced analytics dashboard")
pf4 = EmailPricingFeature("Priority 24-hour support")
pf5 = EmailPricingFeature("Seamless tool integrations")
divider2 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add a comparison with the free plan")
f2 = FollowUpItem("Change the price to annual billing")`,

  `Example 28 — Email with testimonial:
root = Card([email, followups])
email = EmailTemplate("Why teams love Acme", "See what our customers say", [heading, text, divider, testimonial, divider2, btn, divider3, footer])
heading = EmailHeading("Trusted by thousands", 1)
text = EmailText("Don't just take our word for it — hear from our customers.")
divider = EmailDivider()
testimonial = EmailTestimonial("Acme has completely transformed our workflow. The intuitive interface and powerful features have saved our team hours every week. I can't imagine going back.", "https://picsum.photos/seed/ceo/100/100", "Jane Smith", "Jane Smith", "CEO, TechCorp")
divider2 = EmailDivider()
btn = EmailButton("Start Free Trial", "https://example.com/trial", "#4F46E5")
divider3 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add a second testimonial")
f2 = FollowUpItem("Include customer stats")`,

  `Example 29 — Feedback survey email:
root = Card([email, followups])
email = EmailTemplate("How are we doing?", "Rate your experience with Acme", [heading, text, divider, survey, divider2, footer])
heading = EmailHeading("We value your feedback", 1)
text = EmailText("Hi Alex, you've been using Acme for a month now. We'd love to hear how it's going!")
divider = EmailDivider()
survey = EmailSurveyRating("How would you rate your experience?", "Your feedback helps us improve the product for everyone.", "#4F46E5")
divider2 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add specific feature questions")
f2 = FollowUpItem("Include a text feedback option")`,

  `Example 30 — Stats and metrics email:
root = Card([email, followups])
email = EmailTemplate("Your Monthly Report", "Key metrics for March 2024", [heading, text, divider, stats, divider2, btn, divider3, footer])
heading = EmailHeading("Monthly Report", 1)
text = EmailText("Here's a snapshot of your key metrics this month:")
divider = EmailDivider()
stats = EmailStats([stat1, stat2, stat3])
stat1 = EmailStatItem("12,847", "Total Users")
stat2 = EmailStatItem("94.2%", "Uptime")
stat3 = EmailStatItem("$48.5K", "Revenue")
divider2 = EmailDivider()
btn = EmailButton("View Full Report", "https://example.com/reports/march", "#4F46E5")
divider3 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add a chart section")
f2 = FollowUpItem("Include comparison with last month")`,

  `Example 31 — Product gallery email:
root = Card([email, followups])
email = EmailTemplate("New Collection", "Explore our latest products", [heading, text, divider, grid, divider2, btn, divider3, footer])
heading = EmailHeading("New Collection", 1)
text = EmailText("Check out our latest arrivals — handpicked just for you.")
divider = EmailDivider()
grid = EmailImageGrid("Featured Products", "Browse our curated selection of new arrivals.", [img1, img2, img3, img4])
img1 = EmailImage("https://picsum.photos/seed/product-a/300/288", "Product A")
img2 = EmailImage("https://picsum.photos/seed/product-b/300/288", "Product B")
img3 = EmailImage("https://picsum.photos/seed/product-c/300/288", "Product C")
img4 = EmailImage("https://picsum.photos/seed/product-d/300/288", "Product D")
divider2 = EmailDivider()
btn = EmailButton("Shop All", "https://example.com/shop", "#4F46E5")
divider3 = EmailDivider()
footer = EmailText("Acme Store · 123 Commerce Way · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add product names below each image")
f2 = FollowUpItem("Change to a single product showcase")`,

  `Example 32 — Team introduction email with avatars:
root = Card([email, followups])
email = EmailTemplate("Meet Our Team", "The people behind Acme", [heading, intro, divider, avatarGroup, divider2, member1, member2, divider3, footer])
heading = EmailHeading("Meet the Team", 1)
intro = EmailText("We're a small but mighty team passionate about building great products.")
divider = EmailDivider()
avatarGroup = EmailAvatarGroup([av1, av2, av3])
av1 = EmailAvatar("https://picsum.photos/seed/person1/100/100", "Alice", 44)
av2 = EmailAvatar("https://picsum.photos/seed/person2/100/100", "Bob", 44)
av3 = EmailAvatar("https://picsum.photos/seed/person3/100/100", "Carol", 44)
divider2 = EmailDivider()
member1 = EmailAvatarWithText("https://picsum.photos/seed/ceo-avatar/100/100", "Jane Doe", "Jane Doe", "CEO & Co-founder")
member2 = EmailAvatarWithText("https://picsum.photos/seed/cto-avatar/100/100", "John Smith", "John Smith", "CTO & Co-founder")
divider3 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add more team members")
f2 = FollowUpItem("Include team member bios")`,

  `Example 33 — Top features list email:
root = Card([email, followups])
email = EmailTemplate("Top 5 Features", "Discover what makes Acme special", [heading, divider, list, divider2, btn, divider3, footer])
heading = EmailHeading("Top 5 Features", 1)
divider = EmailDivider()
list = EmailList("Why Teams Choose Acme", [item1, item2, item3, item4, item5])
item1 = EmailListItem("Innovative Solutions", "We deliver innovative solutions that drive success and growth.")
item2 = EmailListItem("Exceptional Performance", "Our services deliver high-quality performance and efficiency.")
item3 = EmailListItem("Reliable Support", "We have robust support to keep your operations running smoothly.")
item4 = EmailListItem("Advanced Security", "We implement cutting-edge security measures to protect your data.")
item5 = EmailListItem("Scalable Growth", "We develop customized strategies for sustainable and scalable growth.")
divider2 = EmailDivider()
btn = EmailButton("Get Started", "https://example.com/start", "#4F46E5")
divider3 = EmailDivider()
footer = EmailText("Acme, Inc. · 123 Product Lane · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add icons to each item")
f2 = FollowUpItem("Use a feature grid instead")`,

  `Example 34 — Product review summary email:
root = Card([email, followups])
email = EmailTemplate("Product Reviews Summary", "See what customers are saying", [heading, text, divider, reviews, divider2, footer])
heading = EmailHeading("Customer Reviews", 1)
text = EmailText("Here's a summary of what customers think about our latest product.")
divider = EmailDivider()
reviews = EmailCustomerReview("Product Ratings", 1624, 1019, 162, 97, 199, 147, "Write a Review", "https://example.com/review", "#4F46E5")
divider2 = EmailDivider()
footer = EmailText("Acme Store · 123 Commerce Way · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add a testimonial quote below")
f2 = FollowUpItem("Include top-rated products")`,

  `Example 35 — Marketing bento grid email:
root = Card([email, followups])
email = EmailTemplate("New Product Collection", "Explore our latest arrivals", [header, divider1, bento, divider2, footer])
header = EmailHeaderSideNav("https://picsum.photos/seed/acme-logo/150/42", "Acme", 42, [nav1, nav2])
nav1 = EmailNavLink("Shop", "https://example.com/shop")
nav2 = EmailNavLink("About", "https://example.com/about")
divider1 = EmailDivider()
bento = EmailBentoGrid("Coffee Storage", "Keep your coffee fresher for longer with innovative technology.", "Shop now", "https://example.com/shop", "https://picsum.photos/seed/coffee-hero/400/250", "Coffee Storage", [bi1, bi2])
bi1 = EmailBentoItem("https://picsum.photos/seed/product-x/300/200", "Vacuum Canister", "Auto-Sealing Vacuum Canister", "A container that automatically creates an airtight seal with a button press.")
bi2 = EmailBentoItem("https://picsum.photos/seed/product-y/300/200", "3-Pack Containers", "3-Pack Vacuum Containers", "Keep your coffee fresher for longer with this set of high-performance vacuum containers.")
divider2 = EmailDivider()
footer = EmailText("Acme Store · 123 Commerce Way · San Francisco, CA 94107")
followups = FollowUpBlock([f1, f2])
f1 = FollowUpItem("Add a third product card")
f2 = FollowUpItem("Include customer testimonials")`,
];

// ── Additional rules ──

export const emailAdditionalRules: string[] = [
  "You are an expert email designer using react-email components.",
  "Every response that contains an EmailTemplate MUST also include a FollowUpBlock at the end with 2-3 suggestions for iterating on the email design.",
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

// ── Prompt options ──

export const emailPromptOptions: PromptOptions = {
  examples: emailExamples,
  additionalRules: emailAdditionalRules,
};
