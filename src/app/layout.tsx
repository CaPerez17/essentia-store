import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CartToast } from "@/components/ui/CartToast";
import { MiniCart } from "@/components/ui/MiniCart";
import { QuickViewDrawer } from "@/components/ui/QuickViewDrawer";
import { WelcomePopup } from "@/components/ui/WelcomePopup";
import { PageTransition } from "@/components/ui/PageTransition";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { TikTokPixel } from "@/components/analytics/TikTokPixel";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.essentiaperfumes.co";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const META_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TIKTOK_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const ANALYTICS_ENABLED = process.env.NODE_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Essentia — Perfumería de Nicho en Colombia",
    template: "%s | Essentia",
  },
  description:
    "Fragancias originales de nicho y diseñador. +450 perfumes internacionales con envío a todo Colombia. Armaf, Lattafa, Xerjoff, Montale y más.",
  keywords: [
    "perfumes originales Colombia",
    "perfumería de nicho",
    "fragancias de diseñador",
    "perfumes árabes Colombia",
    "Armaf Colombia",
    "Lattafa Colombia",
    "Montale",
    "Xerjoff",
    "perfumes importados",
    "envío a todo Colombia",
  ],
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: BASE_URL,
    siteName: "Essentia",
    title: "Essentia — Perfumería de Nicho en Colombia",
    description:
      "Fragancias originales de nicho y diseñador. +450 perfumes con envío a todo Colombia.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Essentia — Perfumería de Nicho",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Essentia — Perfumería de Nicho en Colombia",
    description:
      "Fragancias originales de nicho y diseñador. +450 perfumes con envío a todo Colombia.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-[#0c0b09] text-[#e2d9c8]">
        <AnnouncementBar />
        <Header />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <CartToast />
        <MiniCart />
        <QuickViewDrawer />
        <WelcomePopup />
        <CustomCursor />
        {ANALYTICS_ENABLED && (
          <>
            <GoogleAnalytics measurementId={GA_ID} />
            <MetaPixel pixelId={META_ID} />
            <TikTokPixel pixelId={TIKTOK_ID} />
          </>
        )}
      </body>
    </html>
  );
}
