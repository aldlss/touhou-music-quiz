import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RootDocument } from "./_component/rootDocument";
import { ClientInitializer } from "./_tools/clientInitializer";
import { SITE_URL } from "./constant";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  authors: { name: "aldlss", url: "https://github.com/aldlss" },
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootDocument>
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
    </RootDocument>
  );
}
