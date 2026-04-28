# OpenUI × Supabase Chat

A production-ready example of [OpenUI](https://openui.com) chat with full thread persistence using [Supabase](https://supabase.com).

Demonstrates:

- **Per-user thread ownership** via Supabase anonymous auth and Row Level Security
- **Full CRUD persistence** — thread list, message history, rename, delete
- **Real-time sidebar updates** using Supabase Realtime (postgres_changes)
- **OpenAI-compatible streaming** with message history saved to Postgres after each turn
- **`threadApiUrl` wiring** — the canonical way to connect OpenUI to a backend

## Prerequisites

- Node.js 18+ and [pnpm](https://pnpm.io)
- A [Supabase](https://supabase.com) project (free tier is fine)
- An [OpenRouter](https://openrouter.ai) API key, or any OpenAI-compatible LLM provider

## Setup

### 1. Create a Supabase project

Sign up at [supabase.com](https://supabase.com) and create a new project.  Make a note of your **Project URL** and **anon/public key** (Settings → API).

### 2. Enable anonymous sign-in

In the Supabase dashboard go to **Authentication → Providers** and enable the **Anonymous** provider.

### 3. Run the migration

#### Option A — SQL Editor (quickest)

Open the Supabase dashboard, navigate to **SQL Editor**, and paste the contents of:

```
supabase/migrations/20240101000000_create_chat_tables.sql
```

Then click **Run**.

#### Option B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

The migration creates:

| Object | Purpose |
|---|---|
| `threads` table | One row per chat conversation |
| `messages` table | One row per message, linked to a thread |
| RLS policies | Users can only read/write their own rows |
| `update_updated_at` trigger | Keeps `threads.updated_at` fresh |
| Realtime publication | Enables the `postgres_changes` subscription in the UI |

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → anon/public key |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `OPENROUTER_MODEL` _(optional)_ | Defaults to `openai/gpt-4o-mini` |

### 5. Install and run

From the repository root:

```bash
pnpm install
pnpm --filter supabase-chat dev
```

Or from this directory:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How it works

### Authentication

On first visit `supabase.auth.signInAnonymously()` creates a stable anonymous user ID stored in a browser cookie.  Every thread is scoped to this ID via Row Level Security — even anonymous users' data is fully isolated.

When you want to add traditional sign-in, call `supabase.auth.updateUser({ email, password })` to upgrade the anonymous session to a permanent account.  All existing threads transfer automatically.

### Thread persistence

`threadApiUrl="/api/threads"` tells OpenUI to use the default endpoint contract:

| Hook | Method | Route | Purpose |
|---|---|---|---|
| `fetchThreadList` | `GET` | `/api/threads/get` | Sidebar thread list |
| `createThread` | `POST` | `/api/threads/create` | New thread on first message |
| `loadThread` | `GET` | `/api/threads/get/:id` | Restore message history |
| `updateThread` | `PATCH` | `/api/threads/update/:id` | Rename thread |
| `deleteThread` | `DELETE` | `/api/threads/delete/:id` | Remove thread |

### Message format alignment

`messageFormat={openAIMessageFormat}` keeps two paths consistent:

1. **Live chat** — `processMessage` converts to OpenAI format before sending to `/api/chat`
2. **Thread loading** — `loadThread` receives OpenAI-format messages from `/api/threads/get/:id` and `messageFormat.fromApi()` converts them back

Messages are stored in OpenAI format in the `messages` table so both paths use the same representation.

### Message persistence flow

```
User types message
  → ChatProvider calls createThread (first message only)
      → POST /api/threads/create  → INSERT into threads
  → ChatProvider calls processMessage
      → POST /api/chat with { messages, threadId }
          → OpenRouter streams assistant reply
          → After stream: DELETE + re-INSERT all messages for thread_id
  → User reopens thread
      → ChatProvider calls loadThread
          → GET /api/threads/get/:id  → SELECT messages
```

### Real-time updates

A Supabase Realtime channel subscribes to `postgres_changes` on the `threads` table.  When the thread list changes in another tab or device, the subscription fires and remounts `ChatProvider` (via a React `key` change) so the sidebar refreshes automatically.

> **Note:** remounting resets any in-progress conversation in the current tab.
> For a smoother experience, replace the `key` trick with a fine-grained state merge.

---

## Project structure

```
examples/supabase-chat/
├── .env.local.example
├── supabase/
│   └── migrations/
│       └── 20240101000000_create_chat_tables.sql
└── src/
    ├── middleware.ts                      # Refreshes Supabase session on every request
    ├── lib/
    │   └── supabase/
    │       ├── browser.ts                 # Browser client (Client Components)
    │       └── server.ts                  # Server client (Route Handlers)
    └── app/
        ├── layout.tsx
        ├── page.tsx                       # Chat UI + anon auth + Realtime subscription
        └── api/
            ├── chat/
            │   └── route.ts               # LLM streaming + message persistence
            └── threads/
                ├── get/
                │   ├── route.ts           # List threads
                │   └── [id]/route.ts      # Load thread messages
                ├── create/
                │   └── route.ts           # Create thread
                ├── update/
                │   └── [id]/route.ts      # Rename / update thread
                └── delete/
                    └── [id]/route.ts      # Delete thread
```

---

## Going further

- **AI-generated titles** — replace the first-message excerpt in `POST /api/threads/create` with a short LLM call that names the conversation based on its content.
- **Upgrade anonymous users** — add an email/password sign-up form and call `supabase.auth.updateUser()` to convert anonymous sessions to permanent accounts.
- **Append-only message writes** — instead of deleting and re-inserting all messages on every turn, track a `position` column and only insert new rows.
- **Shared threads** — extend the RLS policies to include a `thread_members` join table so threads can be read by invited users.
- **Cursor-based pagination** — the `fetchThreadList` response supports a `nextCursor` field; add `LIMIT`/`OFFSET` (or keyset pagination via `updated_at`) to `/api/threads/get` when thread counts grow large.

## Related docs

- [Connect Thread History](https://openui.com/docs/chat/persistence) — the persistence API reference this example implements
- [OpenUI Chat Quick Start](https://openui.com/docs/chat/quick-start)
