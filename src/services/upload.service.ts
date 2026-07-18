import { env } from "@/config";
import { getAccessToken } from "@/lib/auth-tokens";
import type { ApiError, ApiResponse } from "@/types";
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
  mimeType?: string;
  size?: number;
  filename?: string;
};

export const uploadService = {
  async upload(
    file: File,
    folder: UploadFolder,
    onProgress?: (percent: number) => void
  ): Promise<UploadResult> {
    if (!onProgress) {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const response = await apiClient.post<UploadResult>("/upload", form);
      return response.data;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);

      xhr.open("POST", `${env.apiBaseUrl}/upload`);
      const token = getAccessToken();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      };

      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText) as ApiResponse<UploadResult> & {
            message?: string;
          };
          if (xhr.status >= 200 && xhr.status < 300 && json.data) {
            resolve(json.data);
            return;
          }
          reject({
            message: json.message || "Upload failed",
            status: xhr.status,
          } satisfies ApiError);
        } catch {
          reject({ message: "Upload failed", status: xhr.status } satisfies ApiError);
        }
      };

      xhr.onerror = () => reject({ message: "Upload failed", status: 0 } satisfies ApiError);
      xhr.send(form);
    });
  },

  async remove(publicId: string): Promise<{ result: string }> {
    const response = await apiClient.delete<{ result: string }>(
      `/upload?publicId=${encodeURIComponent(publicId)}`
    );
    return response.data ?? { result: "ok" };
  },
};
