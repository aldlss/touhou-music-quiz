import { MarkdownPage } from "@/app/_component/markdown";
import ChangeLog from "@/CHANGELOG.md";

export default function VersionPage() {
  return <MarkdownPage title="更新记录" markdown={ChangeLog} />;
}
