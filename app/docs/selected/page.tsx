import { MarkdownPage } from "@/app/_component/markdown";
import { fetchBase } from "@/app/constant";
import { fetchDocsText } from "@/app/tools";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "按类目分类的选曲名单",
  description:
    "查看东方原曲认知测验当前索引和筛选的曲目名单，按作品类目分类展示，包含已选用和被剔除的曲子。",
  alternates: {
    canonical: "/docs/selected",
  },
};

export default async function SelectedPage() {
  const musicSelected = await fetchDocsText(`${fetchBase}/musicSelected.md`);
  return <MarkdownPage title="按类目分类的选曲名单" markdown={musicSelected} />;
}
