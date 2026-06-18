import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["maxmind", "geoip-lite"],
};

export default nextConfig;
