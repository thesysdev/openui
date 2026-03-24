# React Email

AI-powered email generator built with [OpenUI](https://openui.com) and [React Email](https://react.email).

Describe an email in natural language, and the AI generates a live preview with exportable HTML. Iterate on the design through follow-up prompts.

## Features

- **44 email components** — headers, footers, feature grids, pricing cards, checkout tables, testimonials, and more
- **Live preview** — see the email render in real time as the AI streams its response
- **Copy HTML** — one-click export of email-client-compatible HTML (pretty-formatted via `@react-email/render`)
- **Copy subject** — grab the generated subject line
- **Conversation starters** — pre-built prompts for common email types (OpenUI launch, abandoned cart, conference invite, travel newsletter)
- **Iterative design** — refine the email through follow-up messages
- **Dark mode** — automatic system theme detection

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
    page.tsx                    # Main app — compose + editor views
    layout.tsx                  # Root layout with theme provider
    api/chat/route.ts           # OpenAI streaming API route
    actions/render-email.tsx    # Server action — converts email to copyable HTML
  components/
    compose-page.tsx            # Landing page with conversation starters
    email-editor.tsx            # Split view — HTML code + live preview
    starters.ts                 # Conversation starter prompts
    session.ts                  # Session persistence (sessionStorage)
    loading-dots.tsx            # Loading animation
  hooks/
    use-system-theme.tsx        # Dark/light theme detection
  generated/
    system-prompt.txt           # Auto-generated from @openuidev/react-email
```

## How It Works

1. The system prompt is auto-generated at build time from `@openuidev/react-email`'s `emailLibrary` and `emailPromptOptions`
2. User describes an email (or clicks a starter)
3. The AI responds in OpenUI Lang format
4. The `Renderer` from `@openuidev/react-lang` parses and renders the email components in real time using `emailLibrary`
5. Once streaming completes, the server action calls `renderEmailToHtml()` with `{ pretty: true }` to produce copyable, formatted HTML

## What the package provides

The `@openuidev/react-email` package exports:

- **`emailLibrary`** — ready-to-use library with 44 components (pass to `<Renderer>`)
- **`emailPromptOptions`** — examples + rules for the LLM system prompt
- **`emailComponentGroups`** — organized component groups with usage notes
- **`emailExamples`** — 10 example email templates
- **`emailAdditionalRules`** — 40 email design rules

Individual components are internal to the library — consumers only need `emailLibrary`.
