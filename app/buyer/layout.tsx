import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/buyer/service-worker-registration";

// §12.7's install flow — manifest/theme-color/apple metadata scoped to
// this segment only, so the Trading Console pages stay a plain web app.
export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DNBP Buyer" },
};

export const viewport: Viewport = {
  themeColor: "#1c63d6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerRegistration />
      {children}
    </>
  );
}
