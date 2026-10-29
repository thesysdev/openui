# Shopping assistant

A runnable companion to the [shopping assistant cookbook](https://www.openui.com/cookbooks/shopping-assistant). Describe what you're shopping for in your own words, browse the products that match its meaning as cards with photos, pick a size and color, and keep a cart with live totals that you can change in place or in words.

Products and carts come from a Shopify store's [Catalog](https://shopify.dev/docs/agents/catalog/storefront-catalog) and [Cart](https://shopify.dev/docs/agents/carts-and-checkout/cart-mcp) MCP tools, which every Shopify store serves at `https://<store>/api/ucp/mcp` with no API key. The default store is OpenUI's demo store, [openui.myshopify.com](https://openui.myshopify.com). OpenUI Supply sells about 1,000 products in US dollars, from $8 to $210, featuring Shiro, OpenUI's mascot: apparel and outerwear, shoes, bags, desk and tech gear, home goods, and things for kids and pets, most in several materials and themes. Some sizes and colors are sold out, so you can see disabled options. A catalog that size is hard to browse with filters, so the assistant searches it by meaning with an embedding index, as the [document comparison example](../document-comparison) does with long reports. It runs on Next.js, Agent Interface, OpenUI Gateway's Chat Completions API, the MCP TypeScript SDK, and OpenAI embeddings.

## Run

Requirements: Node.js 22.13+ and npm. This is a standalone example outside the package workspace.

```bash
npm ci
```

Configure `THESYS_API_KEY` from the [Thesys Console](https://console.thesys.dev/keys) and `OPENAI_API_KEY` from the [OpenAI Platform](https://platform.openai.com/api-keys), for embeddings, privately in `.env.local`. Optional `OPENUI_MODEL` selects a supported `provider/model` identifier; the default is `openai/gpt-5.5`. Optional `SHOPIFY_STORE` points the app at another store, such as `your-store.myshopify.com`; the default is `openui.myshopify.com`.

```bash
npm run prepare:catalog
npm run dev
```

`prepare:catalog` reads every product from the store's public product feed and embeds about 1,000 products into `data/catalog.sqlite` in about 15 seconds, for well under a cent. Run it again whenever the catalog changes, or after changing `SHOPIFY_STORE`. Open http://localhost:3000. To use another port, run `npm run dev -- --port 3001`.

Try:

- “What do you sell? Show me a few favorites.” The assistant browses the catalog and recommends a few products without asking what you want first.
- “Something warm for a cold office that isn't wool, in Medium.” The assistant finds fleece, cotton, and synthetic layers by meaning, keeps those with Medium in stock, and says what made each one fit.
- “Find shoes under $100 in size 9.” The assistant keeps the shoes with size 9 in stock within the budget and shows them as cards.
- **Select options** on one of the shoes. Size 9 is already chosen; pick a color and a quantity, then **Add to cart**.
- “A gift under $50 for a friend who drinks a lot of tea.” Ceramic tea sets and a bottle that's good for tea, with a close match left out as over budget.
- Open **Cart** in the header at any point. Click + or − on an item: the count and total update right away, with no new answer.
- “Put together a gift set under $100 for a friend who codes late at night.” The assistant proposes a bundle with every product selected; deselect what you don't want, pick a size if asked, and add the rest in one step.
- **Make a gift card for this set.** Fill in the names and message, and a printable card opens in the side panel, with **Print** and **Download** (as a PNG).

## How it works

1. Agent Interface sends the new message to `/api/chat`, which loads the thread's earlier turns from Gateway and calls OpenUI Gateway's Chat Completions API.
2. The model calls `search_products` with the shopper's description. The server embeds it, ranks every product in `data/catalog.sqlite` by similarity, picks 12 close but different products, and checks them with the store's `lookup_catalog` tool, six at a time until six fit. It keeps the products with an in-stock variant that fits the size, color, and budget, and returns their photos, prices, and options.
3. The model shows the products as cards. **Select options** asks for that product's variant form: one set of chips per option, with sold-out values disabled, and a quantity.
4. When the shopper submits the form, the model calls `update_cart` with the product id and the chosen values. The server finds the variant with `get_product`, reads the cart, applies the change, and writes the full cart back with `create_cart` or `update_cart`.
5. The model answers with a short confirmation and `CartLink`, which marks the cart change. A cart button in the thread header finds the thread's cart id in those marks, shows the item count, and opens the cart as a popover, loaded from the store through `/api/cart`, with each item's photo, + and − buttons, the total, and **Continue to checkout** when the store returns a checkout link. After each cart change the gift card is offered as a follow-up.
6. For a kit or gift set, the model proposes a bundle as a form of selectable product cards, and adds the selected ones with one `update_cart` call.
7. For a gift card, the model asks for the names and a message, then writes the card as a complete HTML document in an `HtmlArtifact`, which opens in Agent Interface's side panel.

## Files

| File                                  | Purpose                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/lib/shopify.ts`                  | MCP client for the store's catalog and cart tools, and price formatting                                             |
| `scripts/prepare-catalog.ts`          | Reads the store's product feed, embeds each product's text, and writes `data/catalog.sqlite`                        |
| `src/lib/catalog.ts`                  | Loads the catalog index, ranks products by similarity, and picks a diverse set                                      |
| `src/lib/embeddings.ts`               | OpenAI embeddings and similarity                                                                                    |
| `src/lib/tools/search-products.ts`    | Function schema, argument validation, search by meaning, live stock and budget check, results                       |
| `src/lib/tools/update-cart.ts`        | Function schema, argument validation, cart changes, and cart summary                                                |
| `src/library.ts`                      | The chat library, with `CartLink` and `HtmlArtifact` added and `Card` redefined to hold them                        |
| `src/components/cart.tsx`             | The header's cart button and popover, and `CartLink`, which marks cart changes in answers                           |
| `src/app/api/cart/route.ts`           | Reads the cart and sets an item's quantity for the header's cart                                                    |
| `src/components/html-artifact.tsx`    | The gift card: a button in the answer and a side panel with the sandboxed page                                      |
| `src/lib/prompt.ts`                   | Shopping rules and one example for each step                                                                        |
| `src/lib/gateway-history.ts`          | Loads a thread's stored turns from Gateway as chat messages                                                         |
| `src/app/api/chat/route.ts`           | `runTools()` generation, streaming, and turn storage                                                                |
| `src/app/api/frontend-token/route.ts` | Frontend token for Gateway thread storage                                                                           |
| `src/lib/theme.ts`                    | Light and dark theme overrides                                                                                      |
| `src/components/shop-chat.tsx`        | Agent Interface, chat transport, thread storage, theme, and starters                                                |
| `src/app/styles.css`                  | Page layout, full-width photos on the bundle cards, the header's cart, the gift card panel, and plain number fields |

`npm run generate` creates the ignored component specification before dev/build/verify. The server passes that specification to `generateSystemPrompt({ cloud: true, library: spec, promptOptions })`, and Agent Interface renders responses with the same component library.

## Search by meaning

The store's `search_catalog` tool ranks products its own way and returns only its best matches: asked for “something for a cold office”, it returns four hoodies from one Pastel collection first, and it can't list a whole catalog. An index of your own lets you choose what each product is found by and return products that differ from each other. `npm run prepare:catalog` reads the catalog from `https://<store>/products.json`, which every Shopify online store serves with no key, 250 products per page, and embeds each product's title, description, type, tags, and option values with OpenAI's `text-embedding-3-small`, in batches of 100. It writes a new SQLite database next to `data/catalog.sqlite` and swaps it in, so a failed run leaves the previous index. Each row holds the product id, title, text, starting price, one photo per color, and the embedding.

`search_products` embeds the query, loads the index into memory on first use, and ranks every product by dot product, which is cosine similarity for OpenAI's normalized vectors; about 1,000 comparisons take a few milliseconds. It drops products more than 10% over the budget by their indexed price, then picks 12 with maximal marginal relevance, trading similarity to the request against similarity to the products already picked, so near-copies of one product, such as the same rain shell in several prints, don't fill every result. It checks them with the store, six at a time until six fit, because the index can be out of date: prices and stock always come from the store, and a product the store no longer sells is reported in `left_out` as no longer sold. For a much larger catalog, store the embeddings in a vector database and keep the tool's contract.

`data/` is ignored by git. Without the index, a search fails with a message that asks you to run `npm run prepare:catalog`; without `OPENAI_API_KEY`, it asks you to configure it.

## The store's MCP server

Shopify stores speak the [Universal Commerce Protocol](https://ucp.dev) (UCP) over MCP. Every request names the agent's UCP profile, which lists the capabilities it supports; the example uses Shopify's example profile. Publish your own profile before deploying. Writes carry an idempotency key, so a retried request can't add an item twice. Each search and each cart change makes all its calls in one MCP session, because opening a session takes requests of its own and Shopify limits each client's request rate.

The app calls the store from two function tools rather than giving the model the store's tools directly:

- `search_products` keeps each product's title, a short description, one photo per color from the index, taken from the variants because the store lists only the featured photo at the product level, resized by Shopify's CDN (tens of kilobytes instead of up to a few megabytes), the live price, and every value of each option, marked in stock when the store checked it. It asks the store with `get_product` for the in-stock variants with a requested size or color, because a catalog result lists at most 10 variants per product, and reports what it left out and why, such as sold out, over budget, or no longer sold.
- `update_cart` takes products to add, with the chosen value of each option, and quantities to set for items in the cart. The server finds each product's variant with `get_product`, so the model never handles variant ids. `update_cart` on the store replaces every line, so the server reads the cart first and merges the change, and the model never has to repeat the whole cart. An expired cart is replaced by a new one.

Neither tool forwards the store's messages or tool descriptions to the model; they reach it only as structured data. Prices are live and can change until the shopper checks out.

The cart's `continue_url` opens the store's checkout with the cart's items, and the assistant links to it as **Continue to checkout**; the assistant never takes payment. A store that returns no link gets a note that it has no checkout instead. To check out inside the assistant, add Shopify's [Checkout MCP](https://shopify.dev/docs/agents/checkout/mcp) tools, which require an authorization token.

## Forms

The variant form sends the chosen option values, not a variant id. The model passes them to `update_cart` with the product id from the search result, which stays in the thread's history, and the server finds the variant. Submitted form state contains only the fields the shopper changed, so the prompt tells the model to use its prefilled value for any field missing from the state.

## The cart

The cart lives in Agent Interface's thread header, so it's there for the whole conversation: a button with the item count that opens the cart as a popover. After every cart change, the model answers with a one-line confirmation and `CartLink` with the cart id from the `update_cart` result. `CartLink` renders a **View cart** button and opens the popover once after a change streams in.

The cart button keeps no state of its own. It reads the thread's messages with `useThread()` and takes the cart id from the latest `CartLink`, so a new chat has no cart button and a thread opened again finds its cart. It loads the cart from `/api/cart`, which calls the store's `get_cart`, so its items, photos, and totals are always the store's. Its + and − buttons and **Remove** post one quantity to the same route, which changes the cart with the same server code as `update_cart`, so a change needs no model turn. The model doesn't see those changes until it asks: the prompt tells it to read the cart with `update_cart` before describing it.

## The gift card

`HtmlArtifact(title, document)` is the other component the example adds to the chat library, following the [HTML artifact example](../../miscellaneous/html-artifact). The model writes the card as a complete HTML document with an inline style sheet. While it streams, the answer shows a status line; when it's done, the answer shows a button, and the page opens in Agent Interface's side panel with **Print** and **Download**. **Download** saves the card as a PNG with [`html-to-image`](https://github.com/bubkoo/html-to-image), which can draw the product photos because Shopify's CDN allows cross-origin reads. The panel opens by itself for a card that just streamed, not for cards in a thread you open again.

The page renders in an iframe sandboxed without scripts. `allow-same-origin` lets the **Print** button reach the iframe's window and `allow-modals` lets it open the print dialog; with no `allow-scripts`, nothing in the page runs. A content security policy injected into the document allows inline styles and images from `cdn.shopify.com` only, so the card can't load anything else. Before deploying, also validate the document on the server and limit its size.

The chat library's `Card` lists the components it can hold, so `src/library.ts` redefines it with the same props and renderer plus `HtmlArtifact`, and adds a component group for it. Without that, the generated prompt tells the model a `Card` can't contain one.

## Conversations

The OpenAI SDK sends requests to `https://api.thesys.dev/v1/embed/chat/completions` using `THESYS_API_KEY`. Chat Completions does not store conversations, so the chat route stores each turn in the thread's Gateway conversation and loads the earlier turns from there for every turn.

Agent Interface stores the thread list with Gateway's [Conversations API](https://www.openui.com/docs/gateway/api/conversations) through `useOpenuiCloudStorage()`. The browser calls Gateway directly with a short-lived [frontend token](https://www.openui.com/docs/gateway/authentication#frontend-tokens) from `/api/frontend-token`, which mints it with `THESYS_API_KEY` for one local user (`DEMO_USER_ID`, default `demo-user`) and app (`APP_ID`, default `shopping-assistant-cookbook`), so the key stays on the server and the browser reaches only those threads. Chat Completions doesn't write turns to a conversation, so the chat route appends each turn, including the tool calls and their results, with `storeChatCompletionHistory()` from [`@openuidev/server`](https://www.openui.com/docs/api-reference/server#conversation-history). A stopped or failed answer still keeps the user's message. Threads stay listed after a reload, and a thread you open again loads its messages. To keep threads in your own database instead, use `restStorage`.

The chat route uses only the new message from the browser. `loadChatCompletionHistory()` in `src/lib/gateway-history.ts` loads the earlier turns from the thread's Gateway conversation, including their searches, cart changes, and results, and the response ends once the turn is stored, so the next step finds it. Each thread has its own cart: the model passes the `cart_id` from the thread's latest cart result to the next change.

The route runs the tools with the OpenAI SDK's [`runTools()`](https://github.com/openai/openai-node#automated-function-calls) and returns the runner's `toReadableStream()`, one JSON chunk per line, which `openAIReadableStreamAdapter()` reads. Chat Completions has no chunk for a tool result, so in a live answer **Behind the scenes** shows each call's arguments but not its result. The tools and prompt can also run on an agent framework such as LangGraph, the Vercel AI SDK, Mastra, or Google ADK; see the [agent runtime integrations](https://www.openui.com/docs/agent/agent-runtimes/langgraph-platform) and the [agent framework examples](../../agent-frameworks).

The app binds to loopback, and every browser shares one local user's threads. For deployment, add [authentication](https://www.openui.com/docs/gateway/authentication), mint each frontend token for the signed-in user, check that each `threadId` belongs to that user before storing a turn in it, keep each user's cart id on the server and check it in `/api/cart`, and add request-size and rate limits to both routes.

## Verify

```bash
npm run verify
```

`verify` generates the component specification and runs a production build with type checking. It needs no credentials, no catalog index, and makes no network calls to the store.

In the browser, click **Add to cart** without choosing a color to see validation, expand **Behind the scenes** to inspect `search_products` and `update_cart`, reload and open a thread to see its cart again, and switch the operating system between light and dark mode.
