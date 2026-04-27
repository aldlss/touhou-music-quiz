import { MarkdownPage } from "@/app/_component/markdown";
import { fetchDocsText } from "@/app/tools";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/docs/selected",
  },
};

export default async function SelectedPage() {
  const musicSelected = await fetchDocsText(
    `${process.env.NEXT_PUBLIC_FETCH_BASE}/musicSelected.md`,
  );
  return <MarkdownPage title="按类目分类的选曲名单" markdown={musicSelected} />;
}
