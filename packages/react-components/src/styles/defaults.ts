import { defaultLightTheme } from "../components/ThemeProvider/defaultTheme";
import { themeToCssVars } from "../components/ThemeProvider/utils";
import { createStyleTag } from "./styleTag";

if (typeof document !== "undefined") {
  // These tags go first in <head>, before React hydrates a server-rendered document (React Router,
  // TanStack Start, Next). React hydrates <head> by position and would match the app's own first
  // <style> against them, failing on the text; it skips styles marked `data-precedence`, its own
  // hoisted-sheet marker, and keeps them when it re-renders the document.
  const precedence = "openui-defaults";

  // Establish the defaults layer before host layers, regardless of import order.
  const order = createStyleTag();
  order.setAttribute("data-openui-layer-order", "");
  order.setAttribute("data-precedence", precedence);
  order.textContent = "@layer openui-defaults;";
  document.head.prepend(order);

  // Token defaults have their own tag, separate from component rules and the host's Goober. They
  // apply to :root itself, so the library never adds a class to the app's <html>, which a
  // server-rendered document would report as a hydration mismatch.
  let sheet = document.getElementById("openui-defaults");
  if (!sheet) {
    sheet = createStyleTag();
    sheet.id = "openui-defaults";
    order.after(sheet);
  }
  sheet.setAttribute("data-precedence", precedence);
  const rule = `@layer openui-defaults{:where(:root){${themeToCssVars({ ...defaultLightTheme })}}}`;
  if (!(sheet.textContent ?? "").includes(rule)) sheet.append(rule);
}
