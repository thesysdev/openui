import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import styles from "./RendererProofLine.module.css";

export interface ProofItem {
  name: string;
  logo: string;
  shimmer: string;
  /* For fine line work that needs fattening, like React's atom. */
  bold?: boolean;
  /* For a mark drawn small inside its box, to match the others' weight. */
  large?: boolean;
}

/* Marks render monochrome; the shimmer that sweeps each one carries the
   brand's colour (Angular and Lynx have no colour of their own, so they
   borrow blue and purple). */
const RENDERERS: ProofItem[] = [
  { name: "React", logo: "/integration-logos/react.svg", shimmer: "#149eca", bold: true },
  { name: "Vue", logo: "/integration-logos/vue.svg", shimmer: "#42b883" },
  { name: "Svelte", logo: "/integration-logos/svelte.svg", shimmer: "#ff3e00" },
  { name: "Angular", logo: "/integration-logos/angular.svg", shimmer: "#3b82f6" },
  { name: "Lynx", logo: "/integration-logos/lynx.svg", shimmer: "#8b5cf6" },
];

/* One quiet line under the hero CTA: by default the renderers OpenUI ships
   for or has a guide for, linking to the full integrations list. Other pages
   pass their own marks and link, e.g. the Dashboards page's models. */
export function RendererProofLine({
  lead = "Renders in",
  items = RENDERERS,
  href = "/docs/integrations",
  more = "and more",
  logosOnly = false,
  className = "",
}: {
  /* Left out when empty. */
  lead?: string;
  items?: ProofItem[];
  href?: string;
  /* The closing words before the arrow. */
  more?: string;
  /* Marks without their names or commas. */
  logosOnly?: boolean;
  className?: string;
}) {
  return (
    <Link className={`${styles.line} ${className}`.trim()} href={href}>
      {lead ? <span className={styles.lead}>{lead}</span> : null}
      <ul className={`${styles.list} ${logosOnly ? styles.listLogos : ""}`.trim()}>
        {items.map((renderer, index) => (
          <li key={renderer.name} className={styles.item}>
            <span
              className={`${styles.logo} ${renderer.bold ? styles.logoBold : ""} ${
                renderer.large ? styles.logoLarge : ""
              }`
                .replace(/\s+/g, " ")
                .trim()}
              style={
                {
                  "--logo-url": `url(${renderer.logo})`,
                  "--shimmer": renderer.shimmer,
                  animationDelay: `${index * 0.2}s`,
                } as CSSProperties
              }
              aria-hidden="true"
            />
            <span className={styles.name}>{renderer.name}</span>
          </li>
        ))}
      </ul>
      <span className={styles.more}>
        {more}
        <ArrowRight className={styles.arrow} aria-hidden />
      </span>
    </Link>
  );
}
