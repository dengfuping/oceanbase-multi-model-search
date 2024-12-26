import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OceanBase 多模融合查询',
  description: 'OceanBase 多模融合查询',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
