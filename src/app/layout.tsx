export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import NextTopLoader from 'nextjs-toploader';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ledger360 — Personal Finance OS',
  description: 'Track wealth, budgets, goals and debt in one place.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
      <head>
        {/* Theme flicker prevention */}
        <Script id="theme-flicker-prevention" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light')}catch(e){}})();`}
        </Script>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

