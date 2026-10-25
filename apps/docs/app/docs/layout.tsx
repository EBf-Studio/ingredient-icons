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
        // The sidebar draws its links 0.5rem further in than its title; match them.
        nav={{ title: <span className="md:ps-2">Documentation</span>, url: '/docs' }}
        searchToggle={{ enabled: false }}
        themeSwitch={{ enabled: false }}
        containerProps={{
          // Sidebar links draw their icon 23px inside the sidebar; 9px more puts it under the
          // logo, which sits 2rem inside --site-width. The grid narrows by the same amount.
          className:
            '[--fd-banner-height:--spacing(14)] md:px-[9px] md:[--fd-layout-width:calc(var(--site-width)-18px)]',
        }}
      >
        {children}
      </DocsLayout>
    </SiteHeaderLayout>
  );
}
