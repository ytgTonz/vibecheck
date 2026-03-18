import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@vibecheck/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      tailwindcss: path.join(__dirname, "node_modules/tailwindcss"),
    },
  },
};

export default nextConfig;
