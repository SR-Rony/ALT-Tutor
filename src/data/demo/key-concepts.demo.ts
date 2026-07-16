export type KeyConceptVideo = {
  id: string;
  title: string;
  duration: string;
  thumbnail:
    | "/images/video-lessons/video-lesson-1.png"
    | "/images/video-lessons/video-lesson-2.png"
    | "/images/video-lessons/video-lesson-3.png"
    | "/images/video-lessons/video-lesson-4.png";
};

export type KeyConceptSection = {
  id: string;
  chapterTitle: string;
  topicTitle: string;
  videos: KeyConceptVideo[];
};

/** Demo catalog for Key Concepts (can be replaced by API later). */
export function getKeyConceptSections(): KeyConceptSection[] {
  return [
    {
      id: "chapter-1",
      chapterTitle: "Chapter 1: Force, Energy and Motion",
      topicTitle: "Topic A.1: Kinematics",
      videos: [
        {
          id: "a1-motion-basics",
          title: "Motion Basics",
          duration: "15 mins",
          thumbnail: "/images/video-lessons/video-lesson-1.png",
        },
        {
          id: "a1-gradients",
          title: "Motion Graphs Part 1 - Gradients",
          duration: "10 mins",
          thumbnail: "/images/video-lessons/video-lesson-2.png",
        },
        {
          id: "a1-areas",
          title: "Motion Graphs Part 2 - Areas and Worked Examples",
          duration: "10 mins",
          thumbnail: "/images/video-lessons/video-lesson-3.png",
        },
        {
          id: "a1-uniform-acceleration",
          title: "Uniformly Accelerated Motion",
          duration: "10 mins",
          thumbnail: "/images/video-lessons/video-lesson-4.png",
        },
      ],
    },
  ];
}
