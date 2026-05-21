import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatar.vercel.sh' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'api.adplatform.raver.ai' },
      { protocol: 'https', hostname: 'apiplatform.raver.ai' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'v3b.fal.media' },
      { protocol: 'https', hostname: '**.fal.media' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: 'kamala-helminthologic-gladys.ngrok-free.dev' },
      { protocol: 'https', hostname: '**.ngrok-free.dev' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
};

export default nextConfig;
