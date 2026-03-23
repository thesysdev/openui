# React Email

AI-powered email generator built with [OpenUI](https://openui.com) and [React Email](https://react.email).

Describe an email in natural language, and the AI generates a live preview with exportable HTML. Iterate on the design through follow-up prompts.

## Features

- **44 email components** — headers, footers, feature grids, pricing cards, checkout tables, testimonials, and more
- **Live preview** — see the email render in real time as the AI streams its response
- **Copy HTML** — one-click export of email-client-compatible HTML
- **Copy subject** — grab the generated subject line
- **Conversation starters** — pre-built prompts for common email types (product launch, abandoned cart, conference invite, travel newsletter)
- **Iterative design** — refine the email through follow-up messages

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
pnpm --filter react-email-example dev
```

## Project Structure

```
src/
  app/
    page.tsx              # Main app — compose + chat views
    layout.tsx            # Root layout with theme provider
    api/chat/route.ts     # OpenAI streaming API route
    actions/render-email.tsx  # Server action to render email to HTML
  components/
    compose-page.tsx      # Landing page with conversation starters
    chat-page.tsx         # Split view — HTML code + live preview
    starters.ts           # Conversation starter prompts
    session.ts            # Session persistence (sessionStorage)
    content-parser.ts     # Message content/context parsing
    format-html.ts        # HTML formatting for display
    icons.tsx             # SVG icon components
    loading-dots.tsx      # Loading animation
  hooks/
    use-system-theme.tsx  # Dark/light theme detection
  generated/
    system-prompt.txt     # Auto-generated from @openuidev/react-email
```

## How It Works

1. The system prompt is generated at build time from `@openuidev/react-email`'s component library, examples, and rules
2. User describes an email (or clicks a starter)
3. The AI responds in OpenUI Lang format
4. The `Renderer` from `@openuidev/react-lang` parses and renders the email components in real time
5. Once streaming completes, the email is rendered to HTML via `@react-email/render` for export
