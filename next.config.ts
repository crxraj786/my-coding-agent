import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-04152b89-ce23-41b2-985e-a3f5182fa72a.space.z.ai",
  ],
};

export default nextConfig;
