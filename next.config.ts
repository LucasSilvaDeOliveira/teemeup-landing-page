import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Course photos come from the CourseRev CDN in this example. The real source decides the host.
    remotePatterns: [{ protocol: "https", hostname: "storage.googleapis.com", pathname: "/courserev-cdn/**" }],
  },
};

export default nextConfig;
