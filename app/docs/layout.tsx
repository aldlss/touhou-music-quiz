import type { Metadata } from "next";
import "./github-markdown.css";

const siteName = "东方原曲认知测验无尽版";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
};

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main className="p-1">{children}</main>;
}
