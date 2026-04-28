import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ClientInitializer } from "./_tools/ClientInitializer";
import { SITE_URL, WEB_DESCRIPTION, WEB_TITLE } from "./constant";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  applicationName: WEB_TITLE,
  title: {
    default: `${WEB_TITLE} | 随机音乐片段听曲答题`,
    template: `%s | ${WEB_TITLE}`,
  },
  keywords:
    "东方Project, 东方原曲, 东方音乐, 东方音乐测验, 东方听歌识曲, 东方原曲认知测验, Touhou, Touhou music, Touhou music quiz",
  description: WEB_DESCRIPTION,
  authors: { name: "aldlss", url: "https://github.com/aldlss" },
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: WEB_TITLE,
    description: WEB_DESCRIPTION,
    url: SITE_URL,
    siteName: WEB_TITLE,
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: WEB_TITLE,
    description: WEB_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.className} bg-bg`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var preferredTheme;
                try {
                  preferredTheme = localStorage.getItem("theme_appearance");
                } catch (err) {}

                var initialTheme = preferredTheme;
                var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

                if (!initialTheme || (initialTheme !== "dark" && initialTheme !== "light")) {
                  initialTheme = darkQuery.matches ? "dark" : "light";
                }

                if (initialTheme === "dark") {
                  document.documentElement.classList.add("dark");
                }
              })();`,
          }}
        />
        <ClientInitializer />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
