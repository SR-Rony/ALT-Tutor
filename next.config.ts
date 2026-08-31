import type { NextConfig } from "next";
import { execSync } from "node:child_process";

function resolveDeploymentId() {
  if (process.env.NEXT_DEPLOYMENT_ID?.trim()) {
    return process.env.NEXT_DEPLOYMENT_ID.trim();
  }
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return `build-${Date.now().toString(36)}`;
  }
}

const deploymentId = resolveDeploymentId();

const nextConfig: NextConfig = {
  // Helps browsers recover after deploys (skew protection query on assets).
  deploymentId,

  generateBuildId: async () => deploymentId,

  images: {
    remotePatterns: [
      // Course/blog thumbnails may be pasted from any HTTPS CDN or site
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.dribbble.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "api.alttutor.org" },
    ],
  },

  async headers() {
    return [
      {
        // HTML / document responses should not be cached forever at CDN edge.
        source: "/:path*",
        headers: [
          {
            key: "CDN-Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        // Hashed build assets are immutable — safe to cache long-term.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
