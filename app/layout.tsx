import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "东方原曲认知测试无尽版",
    description: "东方原曲认知测试，但是是无尽版",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
