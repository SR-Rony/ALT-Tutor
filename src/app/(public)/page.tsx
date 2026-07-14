import {
  HomeAboutSection,
  HomeAcademicProgram,
  HomeAnimatedLessons,
  HomeHelpSection,
  HomeHero,
} from "@/components/public/home";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeAcademicProgram />
      <HomeAnimatedLessons />
      <HomeAboutSection />
      <HomeHelpSection />
    </>
  );
}
