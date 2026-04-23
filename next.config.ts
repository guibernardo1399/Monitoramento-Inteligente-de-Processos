import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ["@prisma/client", ".prisma/client", "pg", "@prisma/adapter-pg"],
};

initOpenNextCloudflareForDev();

export default nextConfig;
