# OpenUI Artifact Demo

A demo application showcasing the OpenUI artifact system for displaying generated code in a resizable side panel.

## Features

- **Artifact Code Blocks**: AI-generated code appears as compact previews in chat
- **Side Panel**: Click "View Code" to open the full code in a resizable artifact panel
- **Syntax Highlighting**: Full Prism-based syntax highlighting in the artifact panel
- **Multiple Artifacts**: Multiple code blocks per conversation, one active at a time
- **Copy to Clipboard**: One-click code copying from the artifact panel

## Getting Started

```bash
# Install dependencies (from repo root)
pnpm install

# Generate the system prompt
pnpm --filter openui-artifact-demo generate:prompt

# Start the development server
pnpm --filter openui-artifact-demo dev
```

Set your OpenAI API key:
```bash
export OPENAI_API_KEY=your-key-here
```

## How It Works

This example extends the standard OpenUI chat library with a custom `ArtifactCodeBlock` component that integrates with the OpenUI artifact system:

1. User asks for code (e.g., "Build me a React login form")
2. AI generates a response using `ArtifactCodeBlock` components
3. Each code block shows an inline preview in the chat
4. Clicking "View Code" opens the full code in the artifact side panel
5. The panel is resizable and supports syntax highlighting + copy

## Architecture

- `src/components/ArtifactCodeBlock/` — Custom genui component with inline preview and artifact panel view
- `src/library.ts` — Extended component library with ArtifactCodeBlock
- `src/app/page.tsx` — Main page using FullScreen layout
- `src/app/api/chat/route.ts` — API route for OpenAI streaming
