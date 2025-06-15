import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

// 副作用引入，初始化客户端相关的内容
import "./_tools/clientSide";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "东方原曲认知测验无尽版",
  keywords: "touhou, music, quiz, game",
  description: "东方原曲认知测验，但是是无尽版",
  authors: { name: "aldlss", url: "https://github.com/aldlss" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
