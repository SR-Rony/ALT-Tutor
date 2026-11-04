import {
  HomeAnimatedVideoLessons,
  HomeCoreFeatures,
  HomeCustomExamBuilder,
  HomeExploreSubjects,
  HomeFeaturedCourses,
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
      <HomeFeaturedCourses />
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
