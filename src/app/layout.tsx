import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://essentia-store.vercel.app";

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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
