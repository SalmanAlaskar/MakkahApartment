import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { dirForLocale, isLocale, type Locale } from "@/lib/i18n/config";

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
    <html lang={typedLocale} dir={dirForLocale(typedLocale)}>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
