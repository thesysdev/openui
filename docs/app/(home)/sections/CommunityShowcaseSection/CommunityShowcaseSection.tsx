import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import { COMMUNITY_SHOWCASE } from "../../data/community-showcase";
import styles from "./CommunityShowcaseSection.module.css";
import { ShowcasePlayer } from "./ShowcasePlayer";

/** The five community projects featured this rotation. */
export function CommunityShowcaseSection() {
  const { projects } = COMMUNITY_SHOWCASE;

  return (
    <section className={styles.section} aria-labelledby="community-showcase-title">
      <div className={styles.header}>
        <SectionHeader
          titleId="community-showcase-title"
          title="Built by the community"
          caption="Featured projects people are building with OpenUI."
        />
      </div>

      <ShowcasePlayer projects={projects} />
    </section>
  );
}
