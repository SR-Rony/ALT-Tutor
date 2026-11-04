import {
  HomeAnimatedVideoLessons,
  HomeCoreFeatures,
  HomeCustomExamBuilder,
  HomeExploreSubjects,
  HomeFinalCta,
  HomeHero,
  HomeHowItWorks,
  HomeMarketplaceSection,
  HomeStatsSection,
  HomeTestimonials,
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
      <HomeTestimonials />
      <HomeFinalCta />
    </>
  );
}
