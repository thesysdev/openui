import styles from "./RendererChips.module.css";

const RENDERERS = [
  { name: "React", logo: "/integration-logos/react.svg" },
  { name: "Vue", logo: "/integration-logos/vue.svg" },
  { name: "Svelte", logo: "/integration-logos/svelte.svg" },
  {
    name: "Angular",
    logo: "/integration-logos/angular.svg",
    invertInDark: true,
  },
  {
    name: "Lynx",
    logo: "/integration-logos/lynx.svg",
    invertInDark: true,
  },
];

/* The renderer chips, inline in a sentence. Display only, not links.
   Phrasing content only, so they can sit in a <p>. */
export function RendererChips() {
  return (
    <>
      {RENDERERS.map((renderer) => (
        <span key={renderer.name} className={styles.chip}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={`${styles.logo} ${renderer.invertInDark ? styles.logoInvertDark : ""}`.trim()}
            src={renderer.logo}
            alt=""
            width={16}
            height={16}
          />
          {renderer.name}
        </span>
      ))}
    </>
  );
}
