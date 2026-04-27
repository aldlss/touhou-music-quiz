import { MarkdownPage } from "@/app/_component/markdown";
import { fetchDocsText } from "@/app/tools";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/docs/same-name",
  },
};

export default async function SameNamePage() {
  const musicSelected = await fetchDocsText(
    `${process.env.NEXT_PUBLIC_FETCH_BASE}/sameNameMusicSelectedMap.md`,
  );
  return <MarkdownPage title="按名称分类的选曲名单" markdown={musicSelected} />;
}
