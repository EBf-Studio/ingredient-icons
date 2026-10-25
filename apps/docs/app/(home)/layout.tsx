import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    // The top bar spans --site-width, like the content below it and the docs.
    <HomeLayout {...baseOptions()} style={{ '--fd-layout-width': 'var(--site-width)' } as React.CSSProperties}>
      {children}
    </HomeLayout>
  );
}
