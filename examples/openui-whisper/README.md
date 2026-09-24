# openui-whispr

**Speak to the screen.** A glowing orb sits in the center and listens by default. When you
pause, your utterance is transcribed by OpenAI Whisper and sent to a chat model running the
**OpenUI** system prompt, which streams back [OpenUI Lang](https://www.openui.com) — rendered
full-screen as live UI. No chat bubbles, no text box: the entire screen *is* the interface.

## Flow

```
🎙 always-on mic → Web Audio VAD detects a pause (end of utterance)
     → MediaRecorder segment → /api/transcribe (Whisper) → text
     → processMessage → /api/chat (OpenUI system prompt)
     → streamed OpenUI Lang → <Renderer/> fills the screen
```

- `src/app/api/transcribe/route.ts` — audio (multipart) → OpenAI Whisper → `{ text }`.
- `src/app/api/chat/route.ts` — messages + OpenUI system prompt → streamed completion.
- `src/components/useVoiceListener.ts` — always-on listener. Meters mic level via an
  `AnalyserNode` and segments speech into utterances using silence detection (voice activity
  detection), transcribing each completed utterance.
- `src/components/Orb.tsx` — the glowing orb. Breathes while idle, scales with your voice
  while it hears you, and pulses while the model is thinking.
- `src/components/VoiceCanvas.tsx` — full-screen surface. Renders the latest assistant
  message via `<Renderer/>`, shows the orb, and provides **Stop listening** / **Reset**.
- `src/app/page.tsx` — wires `ChatProvider` (headless) to `/api/chat` and mounts the canvas.

## Setup

```bash
cp .env.example .env   # then add your OPENAI_API_KEY
pnpm install
pnpm dev
```

Open http://localhost:3000, allow microphone access, and just start speaking — pause when
you're done and the UI renders. Use **Stop listening** to mute and **Reset** to clear.

> Microphone capture requires a secure context — `localhost` works; deploy over HTTPS.

## Configuration

| Env var            | Default      | Purpose                       |
| ------------------ | ------------ | ----------------------------- |
| `OPENAI_API_KEY`   | _(required)_ | Auth for Whisper + chat model |
| `CHAT_MODEL`       | `gpt-5.2`    | Model that generates the UI   |
| `TRANSCRIBE_MODEL` | `whisper-1`  | Speech-to-text model          |
