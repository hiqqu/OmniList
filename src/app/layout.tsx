import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniTrack – Modern All-in-One Medien-Tracker & Sequel Radar',
  description: 'Verwalte Filme, Serien, Anime, Bücher und Videospiele an einem Ort mit automatischem Sequel-Radar.',
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
