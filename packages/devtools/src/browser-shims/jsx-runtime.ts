// React itself doesn't export jsx/jsxs, they only live in this subpath.
import { requireReact } from "./slots";

const react = requireReact();

export const Fragment = react.Fragment;

/**
 * `createElement` key-validates any array found in `props.children`, so
 * children must be lifted out of props and passed positionally. `jsx` keeps
 * its single child as one argument (a dynamic array still warns, as it
 * should); `jsxs` spreads its compiler-proven-static list into varargs,
 * which createElement treats as pre-validated — matching the real
 * `react/jsx-runtime` semantics the browser build cannot import.
 */
function split(props: Record<string, unknown>, key?: string) {
  const { children, ...rest } = props;
  return { children, props: key === undefined ? rest : { ...rest, key } };
}

export function jsx(type: unknown, allProps: Record<string, unknown>, key?: string) {
  const { children, props } = split(allProps, key);
  return children === undefined
    ? react.createElement(type as never, props)
    : react.createElement(type as never, props, children as never);
}

export function jsxs(type: unknown, allProps: Record<string, unknown>, key?: string) {
  const { children, props } = split(allProps, key);
  if (Array.isArray(children)) {
    return react.createElement(type as never, props, ...(children as never[]));
  }
  return children === undefined
    ? react.createElement(type as never, props)
    : react.createElement(type as never, props, children as never);
}
