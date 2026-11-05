import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import styles from "./RendererProofLine.module.css";

/* Marks render monochrome; the shimmer that sweeps each one carries the
   brand's colour (Angular and Lynx have no colour of their own, so they
   borrow blue and purple). */
const RENDERERS = [
  { name: "React", logo: "/integration-logos/react.svg", shimmer: "#149eca", bold: true },
  { name: "Vue", logo: "/integration-logos/vue.svg", shimmer: "#42b883" },
  { name: "Svelte", logo: "/integration-logos/svelte.svg", shimmer: "#ff3e00" },
  { name: "Angular", logo: "/integration-logos/angular.svg", shimmer: "#3b82f6" },
  { name: "Lynx", logo: "/integration-logos/lynx.svg", shimmer: "#8b5cf6" },
];

/* One quiet line under the hero CTA: the renderers OpenUI ships for or has a
   guide for, linking to the full integrations list. */
export function RendererProofLine({ lead = "Renders in" }: { lead?: string }) {
  return (
    <Link className={styles.line} href="/docs/integrations">
      <span className={styles.lead}>{lead}</span>
      <ul className={styles.list}>
        {RENDERERS.map((renderer, index) => (
          <li key={renderer.name} className={styles.item}>
            <span
              className={`${styles.logo} ${renderer.bold ? styles.logoBold : ""}`.trim()}
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
        and more
        <ArrowRight className={styles.arrow} aria-hidden />
      </span>
    </Link>
  );
}
