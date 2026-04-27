import { MarkdownPage } from "@/app/_component/markdown";
import ChangeLog from "@/CHANGELOG.md";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/docs/version",
  },
};

export default function VersionPage() {
  return <MarkdownPage title="更新记录" markdown={ChangeLog} />;
}
