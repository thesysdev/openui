import {
  createLibrary,
  defineComponent,
  type DefinedComponent,
  type Library,
} from "@openuidev/react-lang";
import { z } from "zod/v4";
import { BASE_COMPONENT_GROUPS } from "../core/base-prompt";

/** Base containers a kit component can be placed in. */
export type CardSlot = "MediumCard" | "LargeCard";

export interface KitComponent {
  component: DefinedComponent<any>;
  /** Cards that accept this component as a child. */
  slots: CardSlot[];
}

export interface KitLibraryDefinition {
  /** Prompt group for the kit's own components. */
  group: { name: string; notes: string[] };
  components: KitComponent[];
}

/**
 * Base cards declare their children as a closed union, so adding a component
 * to the library is not enough: the prompt would still tell the model that
 * MediumCard only takes the base components. Rebuild the card with the union
 * widened by the kit components; the renderer and other props are unchanged.
 */
function widenCard(
  card: DefinedComponent<any>,
  extra: DefinedComponent<any>[],
): DefinedComponent<any> {
  if (extra.length === 0) return card;
  const shape = card.props.shape;
  const children = shape.children;
  const array = children instanceof z.ZodDefault ? children.unwrap() : children;
  if (!(array instanceof z.ZodArray) || !(array.element instanceof z.ZodUnion)) {
    throw new Error(
      `[dashboard-kit] ${card.name}.children is no longer an array of a union; update widenCard for the new base library.`,
    );
  }
  const options = [...array.element.options, ...extra.map((c) => c.ref)];
  return defineComponent({
    name: card.name,
    description: card.description,
    props: z.object({ ...shape, children: z.array(z.union(options)).default([]) }),
    component: card.component,
  });
}

/**
 * A base dashboard library plus one kit's components. The base is passed in
 * (for example `dashboardLibrary` from `@openuidev/thesys`), so the kits do not
 * depend on any one dashboard implementation.
 */
export function createKitLibrary(base: Library, def: KitLibraryDefinition): Library {
  const kitComponents = def.components.map((c) => c.component);
  const slotted = (slot: CardSlot) =>
    def.components.filter((c) => c.slots.includes(slot)).map((c) => c.component);

  const components: Record<string, DefinedComponent<any>> = {
    ...base.components,
    MediumCard: widenCard(base.components.MediumCard, slotted("MediumCard")),
    LargeCard: widenCard(base.components.LargeCard, slotted("LargeCard")),
  };
  for (const component of kitComponents) {
    if (components[component.name]) {
      throw new Error(`[dashboard-kit] ${component.name} already exists in the base library.`);
    }
    components[component.name] = component;
  }

  return createLibrary({
    root: base.root ?? "Dashboard",
    components: Object.values(components),
    componentGroups: [
      ...BASE_COMPONENT_GROUPS,
      {
        name: def.group.name,
        components: kitComponents.map((c) => c.name),
        notes: def.group.notes,
      },
    ],
  });
}
