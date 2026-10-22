import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F1117',
};

export const metadata: Metadata = {
  title: 'OmniList – Modern All-in-One Medien-Tracker & Sequel Radar',
  description: 'Verwalte Filme, Serien, Anime, Bücher und Videospiele an einem Ort mit automatischem Sequel-Radar.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="dark">
      <body className="bg-background text-slate-100 antialiased min-h-screen selection:bg-primary/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
