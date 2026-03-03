import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parti ERP | 边缘智造供应链管理系统",
  description: "Parti 品牌铝型材 DIY 零部件定制化 ERP 解决方案 — 采购·生产·库存·销售全链路管控",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
