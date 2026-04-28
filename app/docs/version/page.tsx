import { MarkdownPage } from "@/app/_component/markdown";
import ChangeLog from "@/CHANGELOG.md";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "更新记录",
  description:
    "查看东方原曲认知测验无尽版的版本更新记录，了解功能调整、曲目数据变更和页面修复内容。",
  alternates: {
    canonical: "/docs/version",
  },
};

export default function VersionPage() {
  return <MarkdownPage title="更新记录" markdown={ChangeLog} />;
}
