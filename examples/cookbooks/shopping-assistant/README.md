# Shopping assistant

A runnable companion to the [shopping assistant cookbook](https://www.openui.com/cookbooks/shopping-assistant). Describe what you're shopping for, browse matching products as cards with photos, pick a size and color, and keep a cart with live totals that you can change in place or in words.

Products and carts come from a Shopify store's [Catalog](https://shopify.dev/docs/agents/catalog/storefront-catalog) and [Cart](https://shopify.dev/docs/agents/carts-and-checkout/cart-mcp) MCP tools, which every Shopify store serves at `https://<store>/api/ucp/mcp` with no API key. The default store is OpenUI's demo store, [openui.myshopify.com](https://openui.myshopify.com), which sells a dozen OpenUI merch products in US dollars featuring Shiro, OpenUI's mascot: tees, a hoodie, and a crewneck in sizes Small to X-Large, sneakers and slides in US sizes 6 to 12, caps and beanies, and gifts such as a plush, stickers, a mug, and a tote. One hoodie color is sold out in X-Large, so you can see a disabled option. There is no data to download. It runs on Next.js, Agent Interface, OpenUI Gateway's Chat Completions API, and the MCP TypeScript SDK.

## Run

Requirements: Node.js 22.13+ and npm. This is a standalone example outside the package workspace.

```bash
npm ci
```

Configure `THESYS_API_KEY` from the [Thesys Console](https://console.thesys.dev/keys) privately in `.env.local`. Optional `OPENUI_MODEL` selects a supported `provider/model` identifier; the default is `openai/gpt-5.5`. Optional `SHOPIFY_STORE` points the app at another store, such as `your-store.myshopify.com`; the default is `openui.myshopify.com`.

```bash
npm run dev
```

Open http://localhost:3000. To use another port, run `npm run dev -- --port 3001`.

Try:

- “Find shoes under $100 in size 9.” The assistant searches for shoes, keeps those with size 9 in stock within the budget, and shows them as cards.
- **Select options** on Shiro Canvas Sneakers. Size 9 is already chosen; pick a color and a quantity, then **Add to cart**.
- “Also add the slides in my size.” The assistant adds them to the same cart without asking again.
- Change a quantity in the cart, or set it to 0, and click **Update cart**.
- “Put together a gift set under $100 for a friend who loves OpenUI.” The assistant proposes a bundle with every product selected; deselect what you don't want, pick a size if asked, and add the rest in one step.
- **Make a gift card for this set.** Fill in the names and message, and a printable card opens in the side panel, with **Print** and **Download**.

## How it works

1. Agent Interface sends the new message to `/api/chat`, which loads the thread's earlier turns from Gateway and calls OpenUI Gateway's Chat Completions API.
2. The model calls `search_products`. The server calls `search_catalog` on the store's MCP server, keeps the products with an in-stock variant that fits the size, color, and budget, and returns their photos, prices, options, and variants.
3. The model shows the products as cards. **Select options** asks for that product's variant form: one set of chips per option, with sold-out values disabled, and a quantity.
4. When the shopper submits the form, the model calls `update_cart` with the product id and the chosen values. The server finds the variant with `get_product`, reads the cart, applies the change, and writes the full cart back with `create_cart` or `update_cart`.
5. The model shows the cart as a form with a quantity per item, the totals, and **Continue to checkout** when the store returns a checkout link.
6. For a kit or gift set, the model proposes a bundle as a form of selectable product cards, and adds the selected ones with one `update_cart` call.
7. For a gift card, the model asks for the names and a message, then writes the card as a complete HTML document in an `HtmlArtifact`, which opens in Agent Interface's side panel.

## Files

| File                                  | Purpose                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `src/lib/shopify.ts`                  | MCP client for the store's catalog and cart tools, and price formatting        |
| `src/lib/tools/search-products.ts`    | Function schema, argument validation, stock and budget filter, results         |
| `src/lib/tools/update-cart.ts`        | Function schema, argument validation, cart changes, and cart summary           |
| `src/library.ts`                      | The chat library, with `HtmlArtifact` added and `Card` redefined to hold it    |
| `src/components/html-artifact.tsx`    | The gift card: a button in the answer and a side panel with the sandboxed page |
| `src/lib/prompt.ts`                   | Shopping rules and one example for each step                                   |
| `src/lib/gateway-history.ts`          | Loads a thread's stored turns from Gateway as chat messages                    |
| `src/app/api/chat/route.ts`           | `runTools()` generation, streaming, and turn storage                           |
| `src/app/api/frontend-token/route.ts` | Frontend token for Gateway thread storage                                      |
| `src/lib/theme.ts`                    | Light and dark theme overrides                                                 |
| `src/components/shop-chat.tsx`        | Agent Interface, chat transport, thread storage, theme, and starters           |
| `src/app/styles.css`                  | Page layout, full-width photos on the bundle cards, and the gift card panel    |

`npm run generate` creates the ignored component specification before dev/build/verify. The server passes that specification to `generateSystemPrompt({ cloud: true, library: spec, promptOptions })`, and Agent Interface renders responses with the same component library.

## The store's MCP server

Shopify stores speak the [Universal Commerce Protocol](https://ucp.dev) (UCP) over MCP. Every request names the agent's UCP profile, which lists the capabilities it supports; the example uses Shopify's example profile. Publish your own profile before deploying. Writes carry an idempotency key, so a retried request can't add an item twice.

The app calls the store from two function tools rather than giving the model the store's tools directly:

- `search_products` keeps each product's title, a short description, up to four photos resized by Shopify's CDN (tens of kilobytes instead of up to a few megabytes), the price, and every value of each option, marked in stock when the store checked it. It filters the store's 25 best matches by size, color, and budget itself, asking the store with `get_product` for the in-stock variants with a requested size or color, because a search result lists at most 10 variants per product. It filters by price itself because the store's price filter needs the currency's minor units before the model knows the currency, and reports what it left out and why, such as sold out or over budget.
- `update_cart` takes products to add, with the chosen value of each option, and quantities to set for items in the cart. The server finds each product's variant with `get_product`, so the model never handles variant ids. `update_cart` on the store replaces every line, so the server reads the cart first and merges the change, and the model never has to repeat the whole cart. An expired cart is replaced by a new one.

Neither tool forwards the store's messages or tool descriptions to the model; they reach it only as structured data. Prices are live and can change until the shopper checks out.

The cart's `continue_url` opens the store's checkout with the cart's items, and the assistant links to it as **Continue to checkout**; the assistant never takes payment. A store that returns no link gets a note that it has no checkout instead. To check out inside the assistant, add Shopify's [Checkout MCP](https://shopify.dev/docs/agents/checkout/mcp) tools, which require an authorization token.

## Forms

The variant form sends the chosen option values, not a variant id. The model passes them to `update_cart` with the product id from the search result, which stays in the thread's history, and the server finds the variant. The cart form names each quantity field with its variant id, so **Update cart** sends every quantity with the id it belongs to. Submitted form state contains only the fields the shopper changed, so the prompt tells the model to use its prefilled value for any field missing from the state.

## The gift card

`HtmlArtifact(title, document)` is the one component the example adds to the chat library, following the [HTML artifact example](../../miscellaneous/html-artifact). The model writes the card as a complete HTML document with an inline style sheet. While it streams, the answer shows a status line; when it's done, the answer shows a button, and the page opens in Agent Interface's side panel with **Print** and **Download**. The panel opens by itself for a card that just streamed, not for cards in a thread you open again.

The page renders in an iframe sandboxed without scripts. `allow-same-origin` lets the **Print** button reach the iframe's window and `allow-modals` lets it open the print dialog; with no `allow-scripts`, nothing in the page runs. A content security policy injected into the document allows inline styles and images from `cdn.shopify.com` only, so the card can't load anything else. Before deploying, also validate the document on the server and limit its size.

The chat library's `Card` lists the components it can hold, so `src/library.ts` redefines it with the same props and renderer plus `HtmlArtifact`, and adds a component group for it. Without that, the generated prompt tells the model a `Card` can't contain one.

## Conversations

The OpenAI SDK sends requests to `https://api.thesys.dev/v1/embed/chat/completions` using `THESYS_API_KEY`. Chat Completions does not store conversations, so the chat route stores each turn in the thread's Gateway conversation and loads the earlier turns from there for every turn.

Agent Interface stores the thread list with Gateway's [Conversations API](https://www.openui.com/docs/gateway/api/conversations) through `useOpenuiCloudStorage()`. The browser calls Gateway directly with a short-lived [frontend token](https://www.openui.com/docs/gateway/authentication#frontend-tokens) from `/api/frontend-token`, which mints it with `THESYS_API_KEY` for one local user (`DEMO_USER_ID`, default `demo-user`) and app (`APP_ID`, default `shopping-assistant-cookbook`), so the key stays on the server and the browser reaches only those threads. Chat Completions doesn't write turns to a conversation, so the chat route appends each turn, including the tool calls and their results, with `storeChatCompletionHistory()` from [`@openuidev/server`](https://www.openui.com/docs/api-reference/server#conversation-history). A stopped or failed answer still keeps the user's message. Threads stay listed after a reload, and a thread you open again loads its messages. To keep threads in your own database instead, use `restStorage`.

The chat route uses only the new message from the browser. `loadChatCompletionHistory()` in `src/lib/gateway-history.ts` loads the earlier turns from the thread's Gateway conversation, including their searches, cart changes, and results, and the response ends once the turn is stored, so the next step finds it. Each thread has its own cart: the model passes the `cart_id` from the thread's latest cart result to the next change.

The route runs the tools with the OpenAI SDK's [`runTools()`](https://github.com/openai/openai-node#automated-function-calls) and returns the runner's `toReadableStream()`, one JSON chunk per line, which `openAIReadableStreamAdapter()` reads. Chat Completions has no chunk for a tool result, so in a live answer **Behind the scenes** shows each call's arguments but not its result. The tools and prompt can also run on an agent framework such as LangGraph, the Vercel AI SDK, Mastra, or Google ADK; see the [agent runtime integrations](https://www.openui.com/docs/agent/agent-runtimes/langgraph-platform) and the [agent framework examples](../../agent-frameworks).

The app binds to loopback, and every browser shares one local user's threads. For deployment, add [authentication](https://www.openui.com/docs/gateway/authentication), mint each frontend token for the signed-in user, check that each `threadId` belongs to that user before storing a turn in it, keep each user's cart id on the server instead of in the thread, and add request-size and rate limits to both routes.

## Verify

```bash
npm run verify
```

`verify` generates the component specification and runs a production build with type checking. It needs no credentials and makes no network calls to the store.

In the browser, click **Add to cart** without choosing a color to see validation, expand **Behind the scenes** to inspect `search_products` and `update_cart`, reload and open a thread to see its cart again, and switch the operating system between light and dark mode.
