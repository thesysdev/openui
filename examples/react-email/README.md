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

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (this example lives inside the OpenUI monorepo)
- An [OpenAI API key](https://platform.openai.com/api-keys)

## Getting Started

1. Clone the repo and install dependencies from the monorepo root:

```bash
git clone https://github.com/thesysdev/openui.git
cd openui
pnpm install
```

2. Copy `.env.example` to `.env.local` and add your OpenAI API key:

```bash
cp examples/react-email/.env.example examples/react-email/.env.local
```

Edit `examples/react-email/.env.local`:

```
OPENAI_API_KEY=sk-your-api-key-here
```

3. Start the development server:

```bash
cd examples/react-email
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (auto-generates system prompt) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@openuidev/react-email` | 44 email components + system prompt generation |
| `@openuidev/react-lang` | `Renderer` — parses OpenUI Lang and renders components |
| `@openuidev/react-headless` | Chat thread state management |
| `@react-email/components` | Email-compatible HTML primitives |
| `@react-email/render` | Converts React components to email HTML |
| `next` | App framework (Next.js 16) |
| `openai` | OpenAI streaming API client |

## Project Structure

```
src/
  app/
    page.tsx                          # Main app — compose + editor views
    layout.tsx                        # Root layout with theme provider
    api/chat/route.ts                 # OpenAI streaming API route
  components/
    composePage/
      index.tsx                       # Landing page with conversation starters
      starters.ts                     # Conversation starter prompts
    emailEditor/
      index.tsx                       # Split view orchestrator
      topBar.tsx                      # Header with title + generating indicator
      htmlPanel.tsx                   # Left panel — HTML code output
      previewPanel.tsx                # Right panel — live email preview
      messageInput.tsx                # Bottom input form
      mobileTabToggle.tsx             # Mobile HTML/Preview tab switcher
    loadingDots.tsx                   # Loading animation (shared)
    session.ts                        # Session persistence (shared)
  hooks/
    useSystemTheme.tsx                # Dark/light theme detection
    useIsMobile.ts                    # Responsive breakpoint hook
    useClipboard.ts                   # Copy-to-clipboard hook
    useAutoScroll.ts                  # Auto-scroll with user override
    useEmailRendering.tsx             # HTML rendering + streaming lifecycle
  generated/
    system-prompt.txt                 # Auto-generated from @openuidev/react-email
```

## How It Works

1. The system prompt is auto-generated at build time from `@openuidev/react-email`'s `emailLibrary` and `emailPromptOptions`
2. User describes an email (or clicks a starter)
3. The AI responds in OpenUI Lang format
4. The `Renderer` from `@openuidev/react-lang` parses and renders the email components in real time using `emailLibrary`
5. Once streaming completes, `useEmailRendering` calls `render()` from `@react-email/render` with `{ pretty: true }` client-side to produce copyable, formatted HTML

## What the package provides

The `@openuidev/react-email` package exports:

- **`emailLibrary`** — ready-to-use library with 44 components (pass to `<Renderer>`)
- **`emailPromptOptions`** — examples + rules for the LLM system prompt
- **`emailComponentGroups`** — organized component groups with usage notes
- **`emailExamples`** — 10 example email templates
- **`emailAdditionalRules`** — 40 email design rules

Individual components are internal to the library — consumers only need `emailLibrary`.
