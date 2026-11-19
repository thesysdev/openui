import { root } from "@lynx-js/react";
import "@lynx-js/react/debug";

import { App } from "./App.js";
import "./theme.css";

root.render(<App />);

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}
