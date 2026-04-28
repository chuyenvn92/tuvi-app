import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tử Vi — Âm lịch & Tứ Trụ",
  description: "Xem âm lịch, Can Chi, Tứ Trụ và gợi ý vận hạn theo ngũ hành từ ngày sinh của bạn.",
  keywords: ["tử vi", "âm lịch", "tứ trụ", "bát tự", "ngũ hành", "bản mệnh", "con giáp"],
  openGraph: {
    title: "Tử Vi — Âm lịch & Tứ Trụ",
    description: "Xem âm lịch, Can Chi, Tứ Trụ và gợi ý vận hạn theo ngũ hành từ ngày sinh của bạn.",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
