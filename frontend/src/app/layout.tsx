import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Project Access — Legal Intelligence AI',
  description: 'Indian Criminal Law intelligence and statutory assistant for BNS, BNSS, and Special Acts.',
  icons: {
    icon: '/icon.jpeg',
    shortcut: '/icon.jpeg',
    apple: '/icon.jpeg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-row select-none">
        {children}
      </body>
    </html>
  );
}
