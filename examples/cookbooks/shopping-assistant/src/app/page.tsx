import ShopChat from "../components/shop-chat";
import { store } from "../lib/shopify";

export const dynamic = "force-dynamic";

export default function Page() {
  return <ShopChat store={store} />;
}
