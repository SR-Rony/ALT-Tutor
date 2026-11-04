import {
  HomeCoreFeatures,
  HomeCustomExamBuilder,
  HomeHero,
  HomeMarketplaceSection,
  HomeStatsSection,
} from "@/components/public/home";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeStatsSection />
      <HomeCoreFeatures />
      <HomeMarketplaceSection />
      <HomeCustomExamBuilder />
    </>
  );
}
