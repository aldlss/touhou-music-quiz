import { MarkdownPage } from "@/app/_component/markdown";
import musicSelected from "@/docs/data/sameNameMusicSelectedMap.md";

export default function VersionPage() {
  return <MarkdownPage title="按名称分类的选曲名单" markdown={musicSelected} />;
}
