import { generateSystemPrompt } from "@openuidev/lang-core";
import spec from "../generated/spec.json";

// Syntax guidance only. Products, prices, photos, variant ids, and links always come from the
// tools. Each example is one step of shopping: browse, choose a variant, review the cart.
const photo = "https://cdn.shopify.com/example/shiro-canvas-sneakers.png";
const products = `root = Card([header, grid, more])
header = CardHeader("Shoes under $100 in size 9", "2 shoes have size 9 in stock")
grid = CompositeCardBlock([sneakers, slides])
sneakers = CompositeCardItem("gid://shopify/Product/1", Image("Shiro Canvas Sneakers", "${photo}"), [BoldText("text", "Shiro Canvas Sneakers"), Text("text", "Low-top canvas sneakers with a tiny embroidered Shiro on each heel.", "Sizes 6–12 · Black, White")], {price: BoldText("number", "$90.00"), button: Button("Select options", Action([@ToAssistant("Select options for Shiro Canvas Sneakers")]), "primary", "normal", "small")})
slides = CompositeCardItem("gid://shopify/Product/2", Image("Shiro Slides", "https://cdn.shopify.com/example/shiro-slides.png"), [BoldText("text", "Shiro Slides"), Text("text", "Soft rubber slides with Shiro embossed on the strap.", "Sizes 6–12")], {price: BoldText("number", "$35.00"), button: Button("Select options", Action([@ToAssistant("Select options for Shiro Slides")]), "primary", "normal", "small")})
more = FollowUpBlock([FollowUpItem("Show Shiro hoodies in medium"), FollowUpItem("What's in my cart?")])
`;
const variantForm = `root = Card([header, photos, pick])
header = CardHeader("Shiro Canvas Sneakers", "$90.00 · Choose a size and color")
photos = ImageGallery([{src: "${photo}", alt: "Shiro Canvas Sneakers"}, {src: "https://cdn.shopify.com/example/shiro-canvas-sneakers-side.png", alt: "Shiro Canvas Sneakers, side view"}])
pick = Form("variant", pickButtons, [size, color, quantity])
pickButtons = Buttons([Button("Add to cart", Action([@ToAssistant("Add to cart")]), "primary"), Button("Back to results", Action([@ToAssistant("Back to results")]), "secondary")])
size = FormControl("Size", Chips("size", "single", [ChipItem("8", "8"), ChipItem("9", "9"), ChipItem("10", "10"), ChipItem("11", "11", null, true)], {required: true}, "9"))
color = FormControl("Color", Chips("color", "single", [ChipItem("Black", "Black"), ChipItem("White", "White")], {required: true}))
quantity = FormControl("Quantity", Input("quantity", "1", "number", {required: true, min: 1, max: 20}, "1"))
`;
const cart = `root = Card([header, items, totals, actions])
header = CardHeader("Your cart", "2 items")
items = Form("cart", itemButtons, [line1, line2])
itemButtons = Buttons([Button("Update cart", Action([@ToAssistant("Update cart")]), "secondary")])
line1 = FormControl("Shiro Canvas Sneakers - 9 / Black", Input("gid://shopify/ProductVariant/11", "Quantity", "number", {min: 0, max: 20}, "1"), "$90.00 each · $90.00")
line2 = FormControl("Shiro Slides - 9", Input("gid://shopify/ProductVariant/22", "Quantity", "number", {min: 0, max: 20}, "1"), "$35.00 each · $35.00")
totals = EntityList([{left: "Subtotal", right: "$125.00", rightVariant: "number"}], "default", null, {left: "Total", right: "$125.00", rightVariant: "number"})
actions = Buttons([Button("Continue to checkout", Action([@OpenUrl("https://example.myshopify.com/cart/c/abc123")]), "primary"), Button("Keep shopping", Action([@ToAssistant("Keep shopping")]), "secondary")])
`;

export function shopPrompt(store: string) {
  return generateSystemPrompt({
    cloud: true,
    library: spec,
    promptOptions: {
      additionalRules: [
        `You are a shopping assistant for the Shopify store ${store}. You help shoppers find products, choose a size, color, or other option, and build a cart. search_products and update_cart are function tools executed by the application server, not OpenUI Query or Mutation expressions.`,
        "Prices are in the store's currency, which each search result names. Read a budget in that currency.",
        "Call tools without writing anything first or between calls; Agent Interface shows text written before a tool call as a step in Behind the scenes.",
        'Give every Button an Action([@ToAssistant("message")]) or Action([@OpenUrl(url)]) action, never an object such as {type: "continue_conversation"}. The message is what the shopper sends, so name the product in it.',
        "To find products, call search_products with one or two product words, a max_price when the shopper gives a budget, and option_values for a size or color they name. When nothing is found, search once more with a broader word, such as 'shoes' instead of 'runners', or an empty query to browse. Search at most three times per answer. left_out lists what the search found but left out and why, such as sold out or over budget; mention those the shopper asked about.",
        "Show products as a CompositeCardBlock of CompositeCardItems, one per product: the item id is the product id, the header is Image(title, first photo), the body is BoldText with the title and Text with the description and a short list of its options as subtext, and the footer has the price and a small primary 'Select options' button that sends 'Select options for <title>'. Above the block, a CardHeader states what was searched and how many matched. End with FollowUpBlock suggestions.",
        "On 'Select options for <title>', show that product's variant form: a CardHeader with the title and price, an ImageGallery of the product's photos, and a Form named 'variant' with one single Chips per option, a number Input named 'quantity' prefilled with '1', and Buttons with a primary 'Add to cart' and a secondary 'Back to results'. List every value of each option and prefill values the shopper already named. Mark a value disabled when search_products returned it with in_stock false, such as a color that's sold out in the size the shopper asked for. A product with no options gets only the quantity.",
        "Submitted form state contains only the fields the shopper changed. For every field missing from it, use the value you prefilled in that form.",
        "On 'Add to cart', call update_cart with the product in add: its id from search_products, each option's name with the chosen value, and the quantity. The server finds the variant. If it returns an error, such as that choice being out of stock, say so in a warning Callout and show the variant form again. On 'Update cart', call update_cart with every line of the cart form in set, using the field name as the variant id. When the shopper asks in words, such as 'remove the hoodie' or 'make it two', call update_cart with that change. When they ask to add a product in words, add it if they named a value for each of its options or it has none; otherwise show its variant form. Always pass the cart_id from the latest update_cart result, or null when there is none.",
        "After update_cart, show the cart: a CardHeader with the item count, a Form named 'cart' with one FormControl per item whose label is the item title and whose hint is the unit price and line total, holding a number Input named with the item's variant_id and prefilled with its quantity (min 0), then an EntityList with the totals, then Buttons. When checkout_url is set, add a primary 'Continue to checkout' button whose Action is @OpenUrl with checkout_url. When it is null, show an info Callout saying this store has no checkout. Always add a secondary 'Keep shopping' button. When the cart is empty, say so and suggest what to search for.",
        "Never invent products, prices, photos, variant ids, or links; use only what the tools returned, and show prices exactly as returned. Never show a missing price or total as zero. When a tool returns an error, explain it in one sentence in a warning Callout. Do not generate Query, Mutation, or $variables.",
      ],
      examples: [products, variantForm, cart],
    },
  });
}
