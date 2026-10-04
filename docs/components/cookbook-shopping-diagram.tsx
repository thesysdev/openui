// How the shopping assistant cookbook turns a request into a cart.
// Every label avoids cookbook-specific terms so the diagram stands on its own.

const mono = "font-mono font-bold uppercase";
const label = `fill-fd-foreground ${mono} text-[13px] tracking-[0.1em]`;
const caption = "fill-fd-muted-foreground font-mono text-[12px] uppercase tracking-[0.1em]";
const note = "fill-fd-muted-foreground font-sans text-[13px]";
const small = "fill-fd-foreground font-sans text-[12px]";
const box = "fill-fd-background stroke-fd-foreground";
const filled = "fill-[#eeeafc] stroke-fd-foreground dark:fill-[#261d4d]";
const accent = "fill-[#5b3fd1] dark:fill-[#a996ff]";
const onAccent = "fill-white font-sans text-[12px] font-semibold dark:fill-[#170c45]";

const screens = [
  { title: "Request", note: "In their own words" },
  { title: "Products", note: "In stock, in budget" },
  { title: "Options", note: "Sold-out ones disabled" },
  { title: "Cart", note: "Then the store's checkout" },
];
const products = [
  { name: "Sneakers", price: "$90" },
  { name: "Slides", price: "$35" },
];
const sizes = ["8", "9", "10", "11"];
const colors = ["Black", "White"];
const lines = [
  { name: "Sneakers · 9 / Black", quantity: "1" },
  { name: "Slides · 9", quantity: "1" },
];
const x = (index: number) => 10 + index * 235;

function Arrow({ d, id, both }: { d: string; id: string; both?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeDasharray={both ? "5 5" : undefined}
      markerStart={both ? `url(#${id}-arrow)` : undefined}
      markerEnd={`url(#${id}-arrow)`}
    />
  );
}

export function CookbookShoppingDiagram() {
  const id = "shopping-diagram";
  return (
    <figure className="not-prose my-6 overflow-x-auto">
      <svg
        viewBox="0 0 930 410"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
        className="h-auto w-full min-w-[640px] text-fd-foreground"
      >
        <title id={`${id}-title`}>From a request to a cart</title>
        <desc id={`${id}-description`}>
          A shopper writes “Shoes under $100 in size 9.” The model replies with product cards for
          the shoes that have size 9 in stock within the budget. The shopper opens one and sees a
          form with the size already chosen, a chip for each color, and sold-out values disabled.
          After they add it, the cart shows each item with an editable quantity, the total, and a
          Checkout button that opens the store&apos;s own checkout. Your server calls the
          store&apos;s MCP server for every search and cart change, and saves each turn to the
          thread&apos;s Gateway conversation, so the thread reopens later with its messages and its
          cart.
        </desc>
        <defs>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="11"
            markerHeight="11"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path
              d="M1 1 L9 5 L1 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>

        <text x={10} y={22} className={caption}>
          In the chat
        </text>
        {screens.map((screen, index) => (
          <g key={screen.title}>
            <rect
              x={x(index)}
              y={36}
              width={205}
              height={176}
              rx={12}
              strokeWidth={1.75}
              className={box}
            />
            <text x={x(index) + 16} y={62} className={label}>
              {screen.title}
            </text>
            <text x={x(index) + 16} y={198} className={note}>
              {screen.note}
            </text>
            {index < screens.length - 1 && (
              <Arrow d={`M${x(index) + 209} 124 H${x(index + 1) - 5}`} id={id} />
            )}
          </g>
        ))}

        {/* The request, as a chat message. */}
        <rect x={x(0) + 16} y={78} width={173} height={78} rx={14} className={filled} />
        {["Shoes under", "$100 in size 9."].map((line, index) => (
          <text
            key={line}
            x={x(0) + 30}
            y={112 + index * 20}
            className="fill-fd-foreground font-sans text-[14px]"
          >
            {line}
          </text>
        ))}

        {/* Two product cards, each with a photo, a price, and a button. */}
        {products.map((product, index) => {
          const left = x(1) + 16 + index * 90;
          return (
            <g key={product.name}>
              <rect
                x={left}
                y={76}
                width={83}
                height={98}
                rx={8}
                strokeWidth={1.2}
                className={box}
              />
              <rect x={left + 8} y={84} width={67} height={36} rx={4} className={filled} />
              <text x={left + 8} y={136} className={small}>
                {product.name}
              </text>
              <text x={left + 8} y={151} className={small}>
                {product.price}
              </text>
              <rect x={left + 8} y={157} width={67} height={11} rx={3} className={accent} />
            </g>
          );
        })}

        {/* The variant form: a size already chosen, colors, one sold out. */}
        {sizes.map((size, index) => {
          const left = x(2) + 16 + index * 42;
          const chosen = size === "9";
          const soldOut = size === "11";
          return (
            <g key={size} opacity={soldOut ? 0.4 : 1}>
              <rect
                x={left}
                y={80}
                width={36}
                height={24}
                rx={12}
                strokeWidth={chosen ? 2.4 : 1.2}
                strokeDasharray={soldOut ? "3 3" : undefined}
                className={chosen ? filled : box}
              />
              <text x={left + 18} y={96} textAnchor="middle" className={small}>
                {size}
              </text>
            </g>
          );
        })}
        {colors.map((color, index) => {
          const left = x(2) + 16 + index * 58;
          return (
            <g key={color}>
              <rect
                x={left}
                y={114}
                width={52}
                height={24}
                rx={12}
                strokeWidth={1.2}
                className={box}
              />
              <text x={left + 26} y={130} textAnchor="middle" className={small}>
                {color}
              </text>
            </g>
          );
        })}
        <rect x={x(2) + 16} y={148} width={96} height={24} rx={6} className={accent} />
        <text x={x(2) + 64} y={164} textAnchor="middle" className={onAccent}>
          Add to cart
        </text>

        {/* The cart: quantities to edit, a total, and the checkout button. */}
        {lines.map((line, index) => {
          const y = 76 + index * 28;
          return (
            <g key={line.name}>
              <text x={x(3) + 16} y={y + 15} className={small}>
                {line.name}
              </text>
              <rect
                x={x(3) + 157}
                y={y}
                width={32}
                height={21}
                rx={5}
                strokeWidth={1.2}
                className={box}
              />
              <text x={x(3) + 173} y={y + 15} textAnchor="middle" className={small}>
                {line.quantity}
              </text>
            </g>
          );
        })}
        <text x={x(3) + 16} y={147} className="fill-fd-foreground font-sans text-[12px] font-bold">
          Total $125
        </text>
        <rect x={x(3) + 96} y={133} width={93} height={24} rx={6} className={accent} />
        <text x={x(3) + 142} y={149} textAnchor="middle" className={onAccent}>
          Checkout
        </text>

        {/* Who does what. */}
        <text x={10} y={278} className={caption}>
          Outside the chat
        </text>
        <text x={10} y={302} className={note}>
          The model writes every screen from your components.
        </text>
        <text x={10} y={322} className={note}>
          The catalog, cart, and payment stay with the store.
        </text>

        <Arrow d={`M${x(2) + 102} 218 V256`} id={id} both />
        <rect x={x(2)} y={262} width={205} height={56} rx={28} strokeWidth={1.6} className={box} />
        <text x={x(2) + 102} y={286} textAnchor="middle" className={label}>
          Your server
        </text>
        <text x={x(2) + 102} y={305} textAnchor="middle" className={note}>
          Checks every tool call
        </text>
        <Arrow d={`M${x(2) + 102} 322 V344`} id={id} both />
        <rect x={x(2)} y={350} width={205} height={50} rx={12} strokeWidth={1.6} className={box} />
        <text x={x(2) + 102} y={371} textAnchor="middle" className={label}>
          Store MCP
        </text>
        <text x={x(2) + 102} y={390} textAnchor="middle" className={note}>
          Catalog and cart tools
        </text>

        <Arrow d={`M${x(3) + 102} 218 V256`} id={id} />
        <rect x={x(3)} y={262} width={205} height={56} rx={28} strokeWidth={1.6} className={box} />
        <text x={x(3) + 102} y={286} textAnchor="middle" className={label}>
          Store checkout
        </text>
        <text x={x(3) + 102} y={305} textAnchor="middle" className={note}>
          The shopper pays there
        </text>

        {/* Your server saves each turn to the thread's Gateway conversation. */}
        <Arrow d={`M${x(2) - 4} 290 H${x(1) + 165} V344`} id={id} />
        <rect x={x(1)} y={350} width={205} height={50} rx={12} strokeWidth={1.6} className={box} />
        <text x={x(1) + 102} y={371} textAnchor="middle" className={label}>
          Conversation
        </text>
        <text x={x(1) + 102} y={390} textAnchor="middle" className={note}>
          Keeps each turn in Gateway
        </text>
      </svg>
    </figure>
  );
}
