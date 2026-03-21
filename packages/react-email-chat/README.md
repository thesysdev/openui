# React Email Chat

AI-powered email generator built with [OpenUI](https://github.com/anthropics/openui) and [React Email](https://react.email).

Describe an email in natural language, and the AI generates a live email preview with exportable HTML. Iterate on the design through conversation.

## Features

- **Live email preview** — renders in an iframe for accurate email client representation
- **Copy HTML** — one-click export of email-client-compatible HTML
- **Iterative design** — follow-up suggestions to refine the email
- **Multiple email types** — welcome emails, newsletters, order confirmations, password resets, and more

## Getting Started

1. Copy `.env.example` to `.env.local` and add your OpenAI API key:

```bash
cp .env.example .env.local
```

2. Install dependencies from the monorepo root:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm --filter react-email-chat dev
```

## Email Components

| Component | Description |
|-----------|-------------|
| `EmailTemplate` | Root wrapper with subject, preview text, and Copy HTML |
| `EmailHeading` | Heading (h1-h6) |
| `EmailText` | Body text paragraph |
| `EmailButton` | Call-to-action button with link |
| `EmailImage` | Image with alt text |
| `EmailDivider` | Horizontal divider |
| `EmailLink` | Inline hyperlink |
| `EmailSection` | Content grouping |
| `EmailColumns` | Multi-column row layout |
| `EmailColumn` | Single column in a row |
