import type { ComponentGroup, PromptOptions } from "@openuidev/react-lang";
import { createLibrary } from "@openuidev/react-lang";
import {
  openuiChatComponentGroups,
  openuiChatLibrary,
  openuiChatPromptOptions,
} from "@openuidev/react-ui/genui-lib";

import { ArtifactCodeBlock } from "./components/ArtifactCodeBlock";

// ── Component Groups — extend chat groups, add ArtifactCodeBlock to Content ──

const artifactComponentGroups: ComponentGroup[] = openuiChatComponentGroups.map((group) => {
  if (group.name === "Content") {
    return {
      ...group,
      components: [...group.components, "ArtifactCodeBlock"],
    };
  }
  return group;
});

// ── Library — all chat components + ArtifactCodeBlock ──

export const artifactDemoLibrary = createLibrary({
  root: "Card",
  componentGroups: artifactComponentGroups,
  components: [...Object.values(openuiChatLibrary.components), ArtifactCodeBlock],
});

// ── Prompt Options — extend chat rules with artifact-specific instructions ──

export const artifactDemoPromptOptions: PromptOptions = {
  additionalRules: [
    ...(openuiChatPromptOptions.additionalRules ?? []),
    "ALWAYS use ArtifactCodeBlock for ANY code output. NEVER use regular CodeBlock.",
    "Set title to the filename (e.g. 'LoginForm.tsx', 'sort.py', 'schema.sql').",
    "Set language to the correct syntax highlighting language (e.g. 'typescript', 'python', 'sql', 'css').",
    "You can include multiple ArtifactCodeBlocks in one response — each with a unique title.",
    "Surround code blocks with TextContent for explanations.",
  ],
  examples: [
    ...(openuiChatPromptOptions.examples ?? []),
    `Example — Code generation with artifacts:
root = Card([intro, code1, explanation, code2, followUps])
intro = TextContent("Here's a React login form with validation:", "default")
code1 = ArtifactCodeBlock("typescript", "LoginForm.tsx", "import React, { useState } from 'react';\\n\\nexport function LoginForm() {\\n  const [email, setEmail] = useState('');\\n  const [password, setPassword] = useState('');\\n\\n  return (\\n    <form>\\n      <input value={email} onChange={e => setEmail(e.target.value)} />\\n      <input type=\\"password\\" value={password} onChange={e => setPassword(e.target.value)} />\\n      <button type=\\"submit\\">Login</button>\\n    </form>\\n  );\\n}")
explanation = TextContent("And the validation helper:", "default")
code2 = ArtifactCodeBlock("typescript", "validate.ts", "export function validateEmail(email: string): boolean {\\n  return /^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$/.test(email);\\n}")
followUps = FollowUpBlock([fu1, fu2])
fu1 = FollowUpItem("Add password strength indicator")
fu2 = FollowUpItem("Add form styling with Tailwind")`,
  ],
};

// ── CLI exports — the generate:prompt script expects `library` and `promptOptions` ──

export { artifactDemoLibrary as library, artifactDemoPromptOptions as promptOptions };
