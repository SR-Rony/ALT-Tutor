import {
  HomeAboutSection,
  HomeAcademicProgram,
  HomeAnimatedLessons,
  HomeHelpSection,
  HomeHero,
  HomePhotoGallery,
  HomePracticeQuestions,
} from "@/components/public/home";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomePracticeQuestions />
      <HomeAcademicProgram />
      <HomeAnimatedLessons />
      <HomeAboutSection />
      <HomePhotoGallery />
      <HomeHelpSection />
    </>
  );
}
