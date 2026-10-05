-- ============================================================
-- OpenUI × Supabase Chat — initial schema
-- ============================================================

-- ── Tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS threads (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages are stored in OpenAI chat format so they can be
-- returned directly from loadThread and consumed by openAIMessageFormat.
CREATE TABLE IF NOT EXISTS messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    UUID        NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  role         TEXT        NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content      TEXT,
  -- Populated for assistant messages that invoke tools
  tool_calls   JSONB,
  -- Populated for tool-result messages
  tool_call_id TEXT,
  name         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS threads_user_id_updated_at
  ON threads (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS messages_thread_id_created_at
  ON messages (thread_id, created_at ASC);

-- ── updated_at trigger ───────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security ───────────────────────────────────────

ALTER TABLE threads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Threads: each user can only see and modify their own rows
CREATE POLICY "threads: select own"
  ON threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "threads: insert own"
  ON threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "threads: update own"
  ON threads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "threads: delete own"
  ON threads FOR DELETE
  USING (auth.uid() = user_id);

-- Messages: accessible only through threads the user owns
CREATE POLICY "messages: select via own thread"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = messages.thread_id
        AND threads.user_id = auth.uid()
    )
  );

CREATE POLICY "messages: insert via own thread"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = messages.thread_id
        AND threads.user_id = auth.uid()
    )
  );

CREATE POLICY "messages: delete via own thread"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = messages.thread_id
        AND threads.user_id = auth.uid()
    )
  );

-- ── Realtime ─────────────────────────────────────────────────
-- Allows the client-side Supabase Realtime subscription in page.tsx
-- to receive postgres_changes events for the threads table.

ALTER PUBLICATION supabase_realtime ADD TABLE threads;
