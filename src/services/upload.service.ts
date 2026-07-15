import { apiClient } from "./api-client";

export type UploadFolder =
  | "avatars"
  | "courses"
  | "lessons"
  | "assignments"
  | "blogs"
  | "questionbank";

export type UploadResult = {
  url: string;
  publicId: string;
};

export const uploadService = {
  async upload(file: File, folder: UploadFolder): Promise<UploadResult> {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const response = await apiClient.post<UploadResult>("/upload", form);
    return response.data;
  },
};
