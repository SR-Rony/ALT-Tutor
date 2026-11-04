import {
  HomeCoreFeatures,
  HomeHero,
  HomeStatsSection,
} from "@/components/public/home";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeStatsSection />
      <HomeCoreFeatures />
    </>
  );
}
