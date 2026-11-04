import {
  HomeAnimatedVideoLessons,
  HomeCoreFeatures,
  HomeCustomExamBuilder,
  HomeExploreSubjects,
  HomeHero,
  HomeHowItWorks,
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
      <HomeExploreSubjects />
      <HomeAnimatedVideoLessons />
      <HomeHowItWorks />
    </>
  );
}
