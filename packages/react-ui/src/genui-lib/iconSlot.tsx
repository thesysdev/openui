import type { ReactNode } from "react";
import { IconWrapper } from "../components/_shared/icons";
import { Avatar as OpenUIAvatar, type AvatarColor } from "../components/Avatar";
import { Emoji as OpenUIEmoji } from "../components/Emoji";
import { Shape as OpenUIShape, type ShapeColor, type ShapeKind } from "../components/Shape";

type IconSlotNode =
  | {
      typeName?: string;
      props?: {
        name?: string;
        category?: string;
        emoji?: string;
        label?: string | null;
        src?: string | null;
        domain?: string | null;
        shape?: string | null;
        color?: string | null;
        icon?: unknown;
      };
    }
  | undefined;

/** Renders an Icon, Avatar, Emoji or Shape ref for slots that take them. */
export function renderIconSlot(node: unknown): ReactNode {
  const n = node as IconSlotNode;
  if (n?.typeName === "Shape") {
    const shape = n.props?.shape as unknown as ShapeKind | undefined;
    return shape ? (
      <OpenUIShape
        shape={shape}
        color={(n.props?.color ?? undefined) as ShapeColor | undefined}
        label={n.props?.label ?? undefined}
      />
    ) : undefined;
  }
  if (n?.typeName === "Emoji") {
    return n.props?.emoji ? (
      <OpenUIEmoji emoji={n.props.emoji} label={n.props.label ?? undefined} />
    ) : undefined;
  }
  if (!n?.props?.name) return undefined;
  if (n.typeName === "Avatar") {
    return (
      <OpenUIAvatar
        name={n.props.name}
        src={n.props.src ?? undefined}
        domain={n.props.domain ?? undefined}
        shape={(n.props.shape ?? undefined) as "circle" | "rounded" | undefined}
        color={(n.props.color ?? undefined) as AvatarColor | undefined}
        icon={n.props.icon ? renderIconSlot(n.props.icon) : undefined}
      />
    );
  }
  return <IconWrapper name={n.props.name} category={n.props.category} />;
}
