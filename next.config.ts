import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["maxmind", "geoip-lite"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
