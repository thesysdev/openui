import NextLink from "next/link";
import type { ComponentProps } from "react";

type SiteLinkProps = Omit<ComponentProps<"a">, "href"> & { href: string };

/** Hosted demos are separate Next.js zones and require a full document navigation. */
export function SiteLink({ href, ...props }: SiteLinkProps) {
  const hostedDemo = /^(?:https:\/\/(?:www\.)?openui\.com)?\/demo(?:\/|[?#]|$)/.test(href);
  return hostedDemo ? <a {...props} href={href} /> : <NextLink {...props} href={href} />;
}

export default SiteLink;
