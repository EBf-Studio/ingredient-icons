import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, githubUrl, logoFile } from './shared';
import { iconSrc } from './icons';

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <img src={iconSrc(logoFile, 64)} alt="" width={26} height={26} className="icon-img" />
      <span className="font-display text-[17px] font-semibold tracking-tight">{appName}</span>
    </span>
  );
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Logo />,
    },
    githubUrl,
    links: [
      { text: 'Docs', url: '/docs', active: 'nested-url' },
      { text: 'Icons', url: '/icons', active: 'nested-url' },
    ],
  };
}
