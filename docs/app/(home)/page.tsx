import styles from "./page.module.css";
import { CompatibilitySection } from "./sections/CompatibilitySection/CompatibilitySection";
import { FeaturesSection } from "./sections/FeaturesSection/FeaturesSection";
import { Footer } from "./sections/Footer/Footer";
import { GradientDivider } from "./sections/GradientDivider/GradientDivider";
import { HeroSection } from "./sections/HeroSection/HeroSection";
import { PossibilitiesSection } from "./sections/PossibilitiesSection/PossibilitiesSection";
import { ShiroMascot } from "./sections/ShiroMascot/ShiroMascot";
import { StepsSection } from "./sections/StepsSection/StepsSection";
import { TweetWallSection } from "./sections/TweetWallSection/TweetWallSection";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.heroShell}>
        <HeroSection />
        <ShiroMascot />
        <StepsSection />
      </div>
      <div className={styles.contentSection}>
        <GradientDivider direction="down" />
        <div className={styles.contentShell}>
          <PossibilitiesSection />
          <CompatibilitySection />
          <FeaturesSection />
          <TweetWallSection />
        </div>
        <GradientDivider direction="up" />
      </div>
      <Footer />
    </div>
  );
}
