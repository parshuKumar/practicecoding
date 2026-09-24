import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DSA Sheet',
  description: '353 DSA problems and 140 system design articles, one checklist.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
