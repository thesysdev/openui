/**
 * Turn an openui-lang `Icon(...)` node into the `{ name, category }` shape
 * `@openuidev/react-components` expects.
 *
 * The library hands icons over as element nodes; react-components' IconTag,
 * IconText and IconWrapper all take a plain IconProps object. This is the one
 * place that conversion happens, so the kit's components can wrap
 * react-components directly instead of re-implementing the badge markup.
 */
export interface IconNodeProps {
  name?: string;
  category?: string;
}

export function toIconProps(icon: unknown): { name: string; category?: string } | null {
  if (!icon) return null;
  if (typeof icon === "string") return { name: icon };
  const node = icon as { props?: IconNodeProps };
  const name = node.props?.name;
  if (!name) return null;
  const category = node.props?.category;
  return category ? { name, category } : { name };
}
