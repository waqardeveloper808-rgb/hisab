import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
    /** Reduce parallel page-data workers to avoid intermittent ENOENT manifest races on Windows CI/desktop builds. */
    cpus: 1,
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
