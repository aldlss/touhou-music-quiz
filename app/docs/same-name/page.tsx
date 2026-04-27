import { MarkdownPage } from "@/app/_component/markdown";
import musicSelected from "@/docs/data/sameNameMusicSelectedMap.md";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/docs/same-name",
  },
};

export default function VersionPage() {
  return <MarkdownPage title="按名称分类的选曲名单" markdown={musicSelected} />;
}
