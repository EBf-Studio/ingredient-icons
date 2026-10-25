import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'Ingredient Icons';
export const packageName = '@ingredient-icons/core';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

export const gitConfig = {
  user: 'EBf-Studio',
  repo: 'ingredient-icons',
  branch: 'main',
};

export const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;
export const newIssueUrl = `${githubUrl}/issues/new`;
export const npmUrl = `https://www.npmjs.com/package/${packageName}`;
export const marmaladeUrl = 'https://try-marmalade.com';

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}

/** The ingredient used as the site logo and favicon. */
export const logoFile = 'en_avocado';
