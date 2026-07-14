import {
  HomeAboutSection,
  HomeAcademicProgram,
  HomeAnimatedLessons,
  HomeHero,
} from "@/components/public/home";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeAcademicProgram />
      <HomeAnimatedLessons />
      <HomeAboutSection />
    </>
  );
}
