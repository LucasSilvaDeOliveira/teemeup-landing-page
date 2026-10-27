import type { NextConfig } from "next";

// Same rule as `indexingAllowed` in lib/config.ts (kept inline: next.config is evaluated outside the app bundle).
const indexingAllowed = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim() !== "" && process.env.NEXT_PUBLIC_NOINDEX !== "1";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return indexingAllowed ? [] : [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Course photos come from the CourseRev CDN in this example. The real source decides the host.
    remotePatterns: [{ protocol: "https", hostname: "storage.googleapis.com", pathname: "/courserev-cdn/**" }],
  },
};

export default nextConfig;
