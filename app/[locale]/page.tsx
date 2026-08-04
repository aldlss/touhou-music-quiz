import type { Metadata } from "next";
import { QuizMain } from "../clientComponent";
import { TouhouMusicQuizContainer } from "../serverComponent";
import {
  checkEnv,
  getSortedDefaultMusicCollection,
} from "../_server/musicData";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SITE_URL } from "../constant";

const openGraphLocales = {
  "zh-CN": "zh_CN",
  en: "en_US",
  ja: "ja_JP",
} as const;

const languageAlternates = {
  "zh-CN": "/",
  en: "/en",
  ja: "/ja",
  "x-default": "/",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const canonical = locale === routing.defaultLocale ? "/" : `/${locale}`;
  return {
    applicationName: t("applicationName"),
    title: { absolute: t("defaultTitle") },
    keywords: t("keywords"),
    description: t("description"),
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    openGraph: {
      title: t("applicationName"),
      description: t("description"),
      url: new URL(canonical, SITE_URL),
      siteName: t("applicationName"),
      locale: openGraphLocales[locale as keyof typeof openGraphLocales],
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t("applicationName"),
      description: t("description"),
    },
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  checkEnv();
  const musicCollection = await getSortedDefaultMusicCollection(locale);
  return (
    <TouhouMusicQuizContainer>
      <QuizMain key={locale} musicCollection={musicCollection} />
    </TouhouMusicQuizContainer>
  );
}
