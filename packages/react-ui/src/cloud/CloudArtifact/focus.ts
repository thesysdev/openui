/** Elements given a tabindex only to take focus back, until they lose it. */
const lent = new WeakSet<Element>();

/** Whether an element can take focus only because `focusBack` lent it a tabindex. */
export const hasLentTabIndex = (element: Element) => lent.has(element);

/** Puts focus on an element, lending it a tabindex for the moment if it can't take focus. */
export function focusBack(element: Element | null | undefined) {
  if (!(element instanceof HTMLElement) || !element.isConnected) return;
  if (element.tabIndex < 0 && !element.hasAttribute("tabindex")) {
    element.setAttribute("tabindex", "-1");
    lent.add(element);
    element.addEventListener(
      "blur",
      () => {
        element.removeAttribute("tabindex");
        lent.delete(element);
      },
      { once: true },
    );
  }
  element.focus({ preventScroll: true });
}
