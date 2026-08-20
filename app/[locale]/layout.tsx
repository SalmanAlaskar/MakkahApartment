import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "../globals.css";
import { dirForLocale, isLocale, type Locale } from "@/lib/i18n/config";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Makkah Apartment",
  description: "Reservation and partner payout tracking for the Makkah apartment",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale: Locale = locale;

  return (
    <html lang={typedLocale} dir={dirForLocale(typedLocale)} className={plexArabic.variable}>
      <body className="min-h-screen bg-stone text-ink antialiased">{children}</body>
    </html>
  );
}
