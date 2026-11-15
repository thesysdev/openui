import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import { COMMUNITY_SHOWCASE, formatFeaturedWindow } from "../../data/community-showcase";
import styles from "./CommunityShowcaseSection.module.css";
import { ShowcasePlayer } from "./ShowcasePlayer";

/** The five community projects featured this rotation. */
export function CommunityShowcaseSection() {
  const { featuredFrom, featuredUntil, projects } = COMMUNITY_SHOWCASE;

  return (
    <section className={styles.section} aria-labelledby="community-showcase-title">
      <div className={styles.header}>
        <SectionHeader
          titleId="community-showcase-title"
          title="Built by the community"
          caption={`Five projects we are featuring this week, ${formatFeaturedWindow(featuredFrom, featuredUntil)}.`}
        />
      </div>

      <ShowcasePlayer projects={projects} />
    </section>
  );
}
