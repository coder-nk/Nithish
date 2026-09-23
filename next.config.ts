import type { NextConfig } from "next";

const isExport = process.env.NEXT_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static export is optional (NEXT_EXPORT=1 npm run build) for CDN hosting.
  ...(isExport ? { output: "export", images: { unoptimized: true } } : {}),
  transpilePackages: ["three"],
  experimental: {
    optimizePackageImports: ["@react-three/drei", "motion", "gsap"],
  },
  // Allow cross-origin access in development from any origin
  allowedDevOrigins: [
    "10.184.40.129",
  ],
  async headers() {
    if (isExport) return [];
    return [
      {
        source: "/models/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
