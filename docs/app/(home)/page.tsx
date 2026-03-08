import { BuildChatSection } from "./components/BuildChatSection";
import { CompatibilitySection } from "./components/CompatibilitySection";
import { FadeInSection } from "./components/FadeInSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { Footer } from "./components/Footer";
import { GradientDivider } from "./components/GradientDivider";
import { HeroSection } from "./components/HeroSection";
import { PossibilitiesSection } from "./components/PossibilitiesSection";
import { ShiroMascot } from "./components/ShiroMascot";
import { StepsSection } from "./components/StepsSection";
import { UILibrariesSection } from "./components/UILibrariesSection";

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen w-full overflow-x-clip relative">
      <HeroSection />
      <div className="mt-16 lg:mt-24">
        <ShiroMascot />
      </div>
      <StepsSection />
      <div className="mt-16 lg:mt-24 relative">
        <GradientDivider direction="down" />
        <div className="bg-black/4 py-20 flex flex-col gap-30 md:gap-60">
          <PossibilitiesSection />
          <div className="flex flex-col gap-8 lg:gap-10">
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
