import { MarkdownPage } from "@/app/_component/markdown";
import musicSelected from "@/docs/data/musicSelected.md";

export default function VersionPage() {
  return <MarkdownPage title="按类目分类的选曲名单" markdown={musicSelected} />;
}
