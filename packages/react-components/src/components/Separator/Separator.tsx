"use client";

import * as RadixSeparator from "@radix-ui/react-separator";
import clsx from "clsx";
import { names, separatorStyles } from "./separator.styles";

const Separator = ({ className, ...props }: React.ComponentProps<typeof RadixSeparator.Root>) => {
  const css = separatorStyles;
  return <RadixSeparator.Root className={clsx(css.root, names.root, className)} {...props} />;
};

export { Separator };
