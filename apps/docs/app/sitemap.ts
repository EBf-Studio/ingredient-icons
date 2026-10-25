import type { MetadataRoute } from 'next';
import { icons } from '@/lib/icons';
import { siteUrl } from '@/lib/shared';
import { source } from '@/lib/source';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, priority: 1 },
    { url: `${siteUrl}/icons`, priority: 0.9 },
    ...source.getPages().map((page) => ({ url: `${siteUrl}${page.url}`, priority: 0.7 })),
    ...icons.map((icon) => ({ url: `${siteUrl}/icons/${icon.slug}`, priority: 0.5 })),
  ];
}
