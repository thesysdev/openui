import type { DefinedComponent } from "@openuidev/react-lang";

/**
 * What one component group adds to the dashboard library. Each group ticket fills in only its
 * own registration file: the registry (./defineComponents.ts) already imports every group, and works out
 * from component names which slots (Card content, Card controls, Section rows, Dashboard
 * children) each component joins, where it sits in the prompt, and which prompt notes apply.
 */
export type Group = {
  /** The group's components, in any order: the prompt follows his library's order. Each has its own props schema. */
  components: readonly DefinedComponent<any>[];
  /**
   * The group's raw CSS blocks, by block name. lib/styles.ts compiles every block once, in the
   * fixed order of STYLE_ORDER, so a block's name must be listed there.
   */
  styles: Readonly<Record<string, string>>;
};

export const emptyGroup: Group = { components: [], styles: {} };
