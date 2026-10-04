// Re-export of the canonical icon renderer in shared/icons: composition/c1's
// lazy IconWrapper — icons load on demand through
// `lucide-react/dynamicIconImports.mjs` (do NOT stub/alias that subpath in
// consumer bundler configs), with category-based fallbacks on a miss.
export { IconWrapper, type IconWrapperProps } from "../../../../components/_shared/icons";
