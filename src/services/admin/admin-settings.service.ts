import { env } from "@/config";
import type { PlatformSettings, PlatformSettingsInput } from "@/types/settings.types";
import { sleep } from "@/utils";
import { apiClient } from "../api-client";

const mockSettings: PlatformSettings = {
  id: "default",
  siteName: "Alt Tutor",
  tagline: "Learn. Teach. Grow.",
  description: "Alt Tutor — your learning platform for students, teachers, and institutions.",
  companyName: "CodeZyne",
  supportEmail: "support@alttutor.com",
  supportPhone: "16780",
  websiteUrl: null,
  facebookUrl: null,
  twitterUrl: null,
  youtubeUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  maintenanceMode: false,
  allowRegistration: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const adminSettingsService = {
  async get(): Promise<PlatformSettings> {
    if (env.useMockApi) {
      await sleep(200);
      return { ...mockSettings };
    }
    const response = await apiClient.get<PlatformSettings>("/settings/admin");
    return response.data;
  },

  async update(payload: PlatformSettingsInput): Promise<PlatformSettings> {
    if (env.useMockApi) {
      await sleep(250);
      Object.assign(mockSettings, payload, { updatedAt: new Date().toISOString() });
      return { ...mockSettings };
    }
    const response = await apiClient.patch<PlatformSettings>("/settings/admin", payload);
    return response.data;
  },
};
