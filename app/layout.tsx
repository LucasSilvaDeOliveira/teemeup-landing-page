import type { Metadata, Viewport } from "next";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/600.css";
import "./globals.css";
import { APP, BRAND, siteUrl } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: BRAND.name,
  description: BRAND.tagline,
  // Safari on iOS shows its own "Open / Get" app banner at the top; no layout cost.
  itunes: { appId: APP.appStoreId },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
