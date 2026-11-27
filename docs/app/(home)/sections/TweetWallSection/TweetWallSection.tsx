import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import { TweetWall } from "../../components/TweetWall/TweetWall";
import styles from "./TweetWallSection.module.css";
import { TweetWallStats } from "./TweetWallStats";

/** Full-width social proof — not wrapped in the BuildChat card; sits on the home content band. */
export function TweetWallSection() {
  return (
    <section className={styles.section} aria-label="What people are saying on X">
      <div className={styles.header}>
        <SectionHeader title="Trusted by thousands of developers">
          <TweetWallStats />
        </SectionHeader>
      </div>
      <TweetWall />
    </section>
  );
}
