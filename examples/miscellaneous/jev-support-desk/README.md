# Jev support desk

A store help page with no chat. The customer describes a problem and gets one working screen: a return form, an exchange form, tracking, an address change.

- **A new kind of request:** an LLM writes the screen in OpenUI Lang. [OpenUI Autofix](https://www.openui.com/docs/api-reference/server) repairs it if it is invalid, and the screen is saved.
- **The same kind of request later, from anyone:** [Jev](https://typesafe.ai) picks the saved screen and the item the request is about, in about 350 ms. No LLM call.

A saved screen holds no customer data. It reads everything through `Query()`, and the tools answer from the signed-in customer and the item Jev picked. The same return form shows Maya's headphones or Arjun's shoes.

## Getting started

```bash
cd examples/miscellaneous/jev-support-desk
pnpm install --ignore-workspace
cp .env.example .env.local
```

Fill in `.env.local` (`pnpm generate:apiKey` writes `THESYS_API_KEY`), then `pnpm dev` and open [localhost:3000](http://localhost:3000). For a recording, use `pnpm build && pnpm start`, which hides the development overlays.

## How it works

1. `/api/turn` asks Jev two questions: which saved screen does this task, and which purchase is it about. The questions never change; saved screen descriptions go in Jev's `state`, because Jev is slow the first time it sees a new question set.
2. On a match, the saved program is sent back and rendered. Its `Query()` calls go to `/api/tools` with the request id, which carries the customer and item.
3. Otherwise the LLM streams a new program. Autofix validates it. If it can serve other customers (it uses `Query()` and hardcodes no customer data), the LLM describes it with example requests and it is saved for Jev to match.

| File                        | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `src/app/api/turn/route.ts` | Reuse or write, then save                           |
| `src/lib/jev.ts`            | The Jev call                                        |
| `src/lib/llm.ts`            | System prompt, screen writing, Autofix, description |
| `src/lib/tools.ts`          | Tools that screens call, with their schemas         |
| `src/lib/screens.ts`        | Saved screens (`.data/screens.json`)                |
| `src/lib/store.ts`          | Demo orders                                         |
| `src/app/page.tsx`          | The page                                            |

## Demo script

Press **Reset** first so no screens are saved.

1. Maya: _I want to return my headphones._ The LLM writes a return form; it is saved as `s1`.
2. Arjun: _Can I send back the running shoes I got last week?_ `s1` is reused with his shoes. Submit it to create a return.
3. Sofia: _The duvet cover isn't what I expected, I'd like a refund._ `s1` again.
4. Arjun: _The shoes are too small, can I swap them for a bigger size?_ Jev knows a return form does not do exchanges, so the LLM writes `s2`.
5. Sofia: _Can I exchange my hiking boots for a size 9?_ `s2` is reused with her boots.

```bash
pnpm verify   # lint + production build
```
