import { MarkdownPage } from "@/app/_component/markdown";
import { fetchBase } from "@/app/constant";
import { fetchDocsText } from "@/app/tools";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "按名称分类的选曲名单",
  description:
    "查看按曲名归并的东方原曲选曲名单，便于对比同名曲目在测验中的保留、剔除和来源情况。",
  alternates: {
    canonical: "/docs/same-name",
  },
};

export default async function SameNamePage() {
  const musicSelected = await fetchDocsText(
    `${fetchBase}/sameNameMusicSelectedMap.md`,
  );
  return <MarkdownPage title="按名称分类的选曲名单" markdown={musicSelected} />;
}
