import { apiClient } from "./api-client";

export type LessonPlayUrl =
  | { kind: "youtube"; embedUrl: string }
  | { kind: "video"; url: string; expiresAt: string };

export const lessonService = {
  getPlayUrl(lessonId: string) {
    return apiClient.get<LessonPlayUrl>(`/lessons/${lessonId}/play-url`).then((response) => response.data);
  },
};
