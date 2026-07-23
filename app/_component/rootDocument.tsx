"use client";

import { useParams } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

export function RootDocument({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ locale?: string }>();
  const locale = hasLocale(routing.locales, params.locale)
    ? params.locale
    : routing.defaultLocale;

  return (
    <html lang={locale} suppressHydrationWarning>
      {children}
    </html>
  );
}
