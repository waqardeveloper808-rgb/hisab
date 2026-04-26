import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  async redirects() {
    return [
      { source: "/workspace-v2/user/:path*", destination: "/workspace/user/:path*", permanent: false },
      { source: "/workspace-v2/user", destination: "/workspace/user", permanent: false },
      { source: "/workspace-v2", destination: "/workspace/user", permanent: false },
    ];
  },
};

export default nextConfig;
