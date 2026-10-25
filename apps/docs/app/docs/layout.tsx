import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { SiteHeaderLayout } from '@/components/site-header-layout';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <SiteHeaderLayout {...baseOptions()}>
      {/* The site bar above already carries the logo, links, search and theme switch.
          Offsetting by its height keeps the sidebar and table of contents below it. */}
      <DocsLayout
        tree={source.getPageTree()}
        nav={{ title: 'Documentation', url: '/docs' }}
        searchToggle={{ enabled: false }}
        themeSwitch={{ enabled: false }}
        containerProps={{ className: '[--fd-banner-height:--spacing(14)]' }}
      >
        {children}
      </DocsLayout>
    </SiteHeaderLayout>
  );
}
