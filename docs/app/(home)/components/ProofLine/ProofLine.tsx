import type { ReactNode } from "react";
import styles from "./ProofLine.module.css";

export interface ProofLineProps {
  /* A monochrome customer logo from /public/logos, given the same silhouette
     treatment LogoStrip uses so the two read as the same family. */
  logoSrc: string;
  /* The customer's name. Every logo in /public/logos is a wordmark, so this is
     the image's alt text rather than a second visible label — writing the name
     again beside the mark would say it twice. */
  company: string;
  /* The claim, with the company name left out: the wordmark opens the line and
     the sentence continues from it ("<mark> shipped X to do Y"). */
  children: ReactNode;
  /* Optional link on the mark, for customers happy to be linked. */
  href?: string;
}

/* One line of customer proof, sized to sit under a section rather than beside
   it. Deliberately not a section of its own: it carries no heading, takes the
   width of whatever hosts it, and stays quiet enough to follow a feature block
   without interrupting the page's rhythm. */
export function ProofLine({ logoSrc, company, children, href }: ProofLineProps) {
  const mark = (
    <img
      className={styles.logo}
      src={logoSrc}
      alt={company}
      width={160}
      height={48}
      loading="lazy"
    />
  );

  return (
    <aside className={styles.line}>
      {href ? (
        <a className={styles.markLink} href={href} target="_blank" rel="noreferrer">
          {mark}
        </a>
      ) : (
        mark
      )}
      <p className={styles.claim}>{children}</p>
    </aside>
  );
}
