// Stands in for the bare "react-dom" specifier (OpenUIDevtools.tsx's
// createPortal, used to eject Debug into its own popup window). Same
// load-order guarantee as browser-shims/react.ts.
import { requireReactDOM } from "./slots";

const reactDOM = requireReactDOM();

export const { createPortal } = reactDOM;
