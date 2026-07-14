import {
  HomeAboutSection,
  HomeAcademicProgram,
  HomeAnimatedLessons,
  HomeHelpSection,
  HomeHero,
  HomePhotoGallery,
} from "@/components/public/home";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeAcademicProgram />
      <HomeAnimatedLessons />
      <HomeAboutSection />
      <HomePhotoGallery />
      <HomeHelpSection />
    </>
  );
}
