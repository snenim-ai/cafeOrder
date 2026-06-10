import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '카페 주문 취합 MVP',
  description: '사내 카페 커피 주문 취합 웹앱 MVP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
