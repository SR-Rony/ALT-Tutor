import {
  HomeAboutSection,
  HomeAcademicProgram,
  HomeAnimatedLessons,
  HomeHelpSection,
  HomeHero,
  HomePhotoGallery,
  HomePracticeQuestions,
  HomeStudentReviews,
} from "@/components/public/home";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomePracticeQuestions />
      <HomeAcademicProgram />
      <HomeAnimatedLessons />
      <HomeAboutSection />
      <HomeStudentReviews />
      <HomePhotoGallery />
      <HomeHelpSection />
    </>
  );
}
