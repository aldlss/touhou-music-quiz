import type { Metadata } from "next";
import { QuizMain } from "../clientComponent";
import { TouhouMusicQuizContainer } from "../serverComponent";
import { checkEnv, getSortedDefaultMusicCollection } from "../tools";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: {
      canonical: locale === routing.defaultLocale ? "/" : `/${locale}`,
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
