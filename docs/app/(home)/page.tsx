import { BuildChatSection } from "./components/BuildChatSection/BuildChatSection";
import { CompatibilitySection } from "./components/CompatibilitySection/CompatibilitySection";
import { FadeInSection } from "./components/FadeInSection/FadeInSection";
import { FeaturesSection } from "./components/FeaturesSection/FeaturesSection";
import { Footer } from "./components/Footer/Footer";
import { GradientDivider } from "./components/GradientDivider/GradientDivider";
import { HeroSection } from "./components/HeroSection/HeroSection";
import { PossibilitiesSection } from "./components/PossibilitiesSection/PossibilitiesSection";
import { ShiroMascot } from "./components/ShiroMascot/ShiroMascot";
import { StepsSection } from "./components/StepsSection/StepsSection";
import { UILibrariesSection } from "./components/UILibrariesSection/UILibrariesSection";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <HeroSection />
      <div className={styles.mascotSection}>
        <ShiroMascot />
      </div>
      <StepsSection />
      <div className={styles.contentSection}>
        <GradientDivider direction="down" />
        <div className={styles.contentShell}>
          <PossibilitiesSection />
          <div className={styles.compatibilityStack}>
            <UILibrariesSection />
            <CompatibilitySection />
          </div>
          <FadeInSection>
            <FeaturesSection />
          </FadeInSection>
          <BuildChatSection />
        </div>
        <GradientDivider direction="up" />
      </div>
      <Footer />
    </div>
  );
}
