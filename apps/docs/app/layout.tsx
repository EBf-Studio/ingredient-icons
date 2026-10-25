import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import { Figtree, Fraunces, JetBrains_Mono } from 'next/font/google';
import { appName, siteUrl } from '@/lib/shared';
import { total } from '@/lib/icons';
import './global.css';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree' });
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
});
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-face' });

const description = `${total} soft 3D icons for cooking ingredients, keyed by the Open Food Facts taxonomy. Public domain, for recipe apps.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${appName}: an icon for every ingredient`, template: `%s | ${appName}` },
  description,
  openGraph: { siteName: appName, description },
  twitter: { card: 'summary_large_image' },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${fraunces.variable} ${mono.variable} font-sans`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
