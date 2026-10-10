"use client";

import { CodeBlockTabs as BaseCodeBlockTabs } from "fumadocs-ui/components/codeblock";
import { Children, isValidElement, useState, type ComponentProps } from "react";

/**
 * Code block tabs that fall back to their first tab when the remembered group value isn't one of
 * theirs. Fumadocs restores a `tab-group` choice as is, so picking "OpenAI" on one page left a
 * block on another page with no matching tab showing nothing.
 */
export function CodeBlockTabs({
  defaultValue,
  children,
  ...props
}: ComponentProps<typeof BaseCodeBlockTabs>) {
  const values = Children.toArray(children).flatMap((child) =>
    isValidElement<{ value?: unknown }>(child) && typeof child.props.value === "string"
      ? [child.props.value]
      : [],
  );
  const [selected, setSelected] = useState(defaultValue ?? values[0]);

  return (
    <BaseCodeBlockTabs
      {...props}
      value={selected !== undefined && values.includes(selected) ? selected : values[0]}
      onValueChange={setSelected}
    >
      {children}
    </BaseCodeBlockTabs>
  );
}
