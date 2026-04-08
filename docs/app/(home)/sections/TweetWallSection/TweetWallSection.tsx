import { TweetWall } from "../../components/TweetWall/TweetWall";
import styles from "./TweetWallSection.module.css";

/** Full-width social proof — not wrapped in the BuildChat card; sits on the home content band. */
export function TweetWallSection() {
  return (
    <section className={styles.section} aria-label="What people are saying on X">
      <TweetWall />
    </section>
  );
}
