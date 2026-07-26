import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bánh Tiêu & Coffee System - High Security OOP Next.js',
  description: 'Hệ thống quản lý đặt bánh tiêu và cà phê bảo mật tuyệt đối kiến trúc OOP',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
