import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Scan Bill sends a (browser-shrunk) photo to a server action.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
