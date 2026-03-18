import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniEdit AI - 通用 AI 图像编辑平台",
  description: "通过 API 调用全球主流图像模型进行专业修图",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
