export type PlatformSettings = {
  id: string;
  siteName: string;
  tagline: string;
  description: string;
  companyName: string;
  supportEmail: string | null;
  supportPhone: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlatformSettingsInput = Partial<
  Omit<PlatformSettings, "id" | "createdAt" | "updatedAt">
>;
